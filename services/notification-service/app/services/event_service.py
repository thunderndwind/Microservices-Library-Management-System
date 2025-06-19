import json
import asyncio
import pika
import threading
from typing import Dict, Any
from datetime import datetime
from loguru import logger

from app.core.config import settings
from app.models.notification import (
    NotificationCreate,
    NotificationType,
    NotificationPriority,
    NOTIFICATION_TEMPLATES
)
from app.services.notification_service import notification_service


class EventService:
    def __init__(self):
        self.connection = None
        self.channel = None
        self.exchange = settings.RABBITMQ_EXCHANGE
        self.is_connected = False

    async def connect(self):
        """Connect to RabbitMQ"""
        try:
            # Use blocking connection for RabbitMQ consumer
            connection_params = pika.ConnectionParameters(
                host=settings.RABBITMQ_HOST,
                port=settings.RABBITMQ_PORT,
                credentials=pika.PlainCredentials(
                    settings.RABBITMQ_USERNAME,
                    settings.RABBITMQ_PASSWORD
                )
            )
            
            self.connection = pika.BlockingConnection(connection_params)
            self.channel = self.connection.channel()
            
            # Declare exchange
            self.channel.exchange_declare(
                exchange=self.exchange,
                exchange_type='topic',
                durable=True
            )
            
            # Declare queues for different event types
            self._declare_queues()
            
            self.is_connected = True
            logger.info("Connected to RabbitMQ successfully")
            
        except Exception as e:
            logger.error(f"Failed to connect to RabbitMQ: {e}")
            self.is_connected = False

    def _declare_queues(self):
        """Declare queues for different event types"""
        queues = [
            ('user_events', ['user.registered', 'user.profile_updated', 'user.suspended']),
            ('admin_events', ['admin.registered', 'admin.login']),
            ('book_events', ['book.created', 'book.updated', 'book.deleted']),
            ('reservation_events', ['reservation.created', 'reservation.returned', 'reservation.overdue', 'reservation.extended']),
        ]
        
        for queue_name, routing_keys in queues:
            # Declare queue
            self.channel.queue_declare(queue=queue_name, durable=True)
            
            # Bind queue to exchange with routing keys
            for routing_key in routing_keys:
                routing_key_formatted = routing_key.replace('.', '_')
                self.channel.queue_bind(
                    exchange=self.exchange,
                    queue=queue_name,
                    routing_key=routing_key_formatted
                )

    async def start_consuming(self):
        """Start consuming events from RabbitMQ in a separate thread"""
        if not self.is_connected:
            await self.connect()
            
        if not self.is_connected:
            logger.error("Cannot start consuming - not connected to RabbitMQ")
            return

        # Run the blocking consumer in a separate thread
        def consume_events():
            try:
                # Set up consumers for each queue
                self.channel.basic_consume(
                    queue='user_events',
                    on_message_callback=self._handle_user_event,
                    auto_ack=False
                )
                
                self.channel.basic_consume(
                    queue='admin_events',
                    on_message_callback=self._handle_admin_event,
                    auto_ack=False
                )
                
                self.channel.basic_consume(
                    queue='book_events',
                    on_message_callback=self._handle_book_event,
                    auto_ack=False
                )
                
                self.channel.basic_consume(
                    queue='reservation_events',
                    on_message_callback=self._handle_reservation_event,
                    auto_ack=False
                )
                
                logger.info("Starting to consume events...")
                self.channel.start_consuming()
                
            except Exception as e:
                logger.error(f"Error while consuming events: {e}")

        # Start the consumer in a daemon thread
        consumer_thread = threading.Thread(target=consume_events, daemon=True)
        consumer_thread.start()
        logger.info("Event consumer started in background thread")

    def _handle_user_event(self, ch, method, properties, body):
        """Handle user-related events"""
        try:
            event_data = json.loads(body.decode('utf-8'))
            event_type = event_data.get('eventType')
            data = event_data.get('data', {})
            
            if event_type == 'user.registered':
                asyncio.create_task(self._create_user_registered_notification(data))
            elif event_type == 'user.suspended':
                asyncio.create_task(self._create_user_suspended_notification(data))
                
            ch.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(f"Processed user event: {event_type}")
            
        except Exception as e:
            logger.error(f"Error handling user event: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def _handle_admin_event(self, ch, method, properties, body):
        """Handle admin-related events"""
        try:
            event_data = json.loads(body.decode('utf-8'))
            event_type = event_data.get('eventType')
            data = event_data.get('data', {})
            
            if event_type == 'admin.registered':
                asyncio.create_task(self._create_admin_registered_notification(data))
                
            ch.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(f"Processed admin event: {event_type}")
            
        except Exception as e:
            logger.error(f"Error handling admin event: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def _handle_book_event(self, ch, method, properties, body):
        """Handle book-related events"""
        try:
            event_data = json.loads(body.decode('utf-8'))
            event_type = event_data.get('eventType')
            data = event_data.get('data', {})
            
            # For now, we'll just log book events
            # In the future, we could notify users about new books, etc.
            logger.info(f"Received book event: {event_type}")
                
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
        except Exception as e:
            logger.error(f"Error handling book event: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def _handle_reservation_event(self, ch, method, properties, body):
        """Handle reservation-related events"""
        try:
            event_data = json.loads(body.decode('utf-8'))
            event_type = event_data.get('eventType')
            data = event_data.get('data', {})
            
            if event_type == 'reservation.created':
                asyncio.create_task(self._create_reservation_created_notification(data))
            elif event_type == 'reservation.returned':
                asyncio.create_task(self._create_reservation_returned_notification(data))
            elif event_type == 'reservation.overdue':
                asyncio.create_task(self._create_reservation_overdue_notification(data))
                
            ch.basic_ack(delivery_tag=method.delivery_tag)
            logger.info(f"Processed reservation event: {event_type}")
            
        except Exception as e:
            logger.error(f"Error handling reservation event: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    async def _create_user_registered_notification(self, data: Dict[str, Any]):
        """Create notification for user registration"""
        try:
            template = NOTIFICATION_TEMPLATES["user_registered"]
            
            notification = NotificationCreate(
                type=NotificationType.SYSTEM,
                recipient_id=data["userId"],
                recipient_email=data.get("email"),
                title=template["title_template"],
                message=template["message_template"].format(
                    first_name=data.get("firstName", "User"),
                    email=data.get("email", "")
                ),
                priority=NotificationPriority.MEDIUM,
                data={"event_type": "user_registered", "user_data": data}
            )
            
            await notification_service.create_notification(notification)
            logger.info(f"Created user registration notification for {data['userId']}")
            
        except Exception as e:
            logger.error(f"Error creating user registered notification: {e}")

    async def _create_user_suspended_notification(self, data: Dict[str, Any]):
        """Create notification for user suspension"""
        try:
            template = NOTIFICATION_TEMPLATES["user_suspended"]
            
            notification = NotificationCreate(
                type=NotificationType.SYSTEM,
                recipient_id=data["userId"],
                title=template["title_template"],
                message=template["message_template"].format(
                    reason=data.get("reason", "No reason provided")
                ),
                priority=NotificationPriority.HIGH,
                data={"event_type": "user_suspended", "suspension_data": data}
            )
            
            await notification_service.create_notification(notification)
            logger.info(f"Created user suspension notification for {data['userId']}")
            
        except Exception as e:
            logger.error(f"Error creating user suspended notification: {e}")

    async def _create_admin_registered_notification(self, data: Dict[str, Any]):
        """Create notification for admin registration"""
        try:
            template = NOTIFICATION_TEMPLATES["admin_registered"]
            
            notification = NotificationCreate(
                type=NotificationType.SYSTEM,
                recipient_id=data["adminId"],
                recipient_email=data.get("email"),
                title=template["title_template"],
                message=template["message_template"].format(
                    first_name=data.get("firstName", "Admin"),
                    role=data.get("role", "admin"),
                    created_by=data.get("createdBy", {}).get("email", "System")
                ),
                priority=NotificationPriority.MEDIUM,
                data={"event_type": "admin_registered", "admin_data": data}
            )
            
            await notification_service.create_notification(notification)
            logger.info(f"Created admin registration notification for {data['adminId']}")
            
        except Exception as e:
            logger.error(f"Error creating admin registered notification: {e}")

    async def _create_reservation_created_notification(self, data: Dict[str, Any]):
        """Create notification for reservation creation"""
        try:
            template = NOTIFICATION_TEMPLATES["reservation_created"]
            
            # We'd need to fetch book details from book service
            # For now, using placeholder data
            notification = NotificationCreate(
                type=NotificationType.SYSTEM,
                recipient_id=data["userId"],
                title=template["title_template"],
                message=template["message_template"].format(
                    book_title=data.get("bookTitle", "Book"),
                    book_author=data.get("bookAuthor", "Author"),
                    due_date=data.get("dueDate", "")
                ),
                priority=NotificationPriority.MEDIUM,
                data={"event_type": "reservation_created", "reservation_data": data}
            )
            
            await notification_service.create_notification(notification)
            logger.info(f"Created reservation notification for {data['userId']}")
            
        except Exception as e:
            logger.error(f"Error creating reservation created notification: {e}")

    async def _create_reservation_returned_notification(self, data: Dict[str, Any]):
        """Create notification for book return"""
        try:
            template = NOTIFICATION_TEMPLATES["reservation_returned"]
            
            notification = NotificationCreate(
                type=NotificationType.SYSTEM,
                recipient_id=data["userId"],
                title=template["title_template"],
                message=template["message_template"].format(
                    book_title=data.get("bookTitle", "Book")
                ),
                priority=NotificationPriority.LOW,
                data={"event_type": "reservation_returned", "reservation_data": data}
            )
            
            await notification_service.create_notification(notification)
            logger.info(f"Created book return notification for {data['userId']}")
            
        except Exception as e:
            logger.error(f"Error creating reservation returned notification: {e}")

    async def _create_reservation_overdue_notification(self, data: Dict[str, Any]):
        """Create notification for overdue book"""
        try:
            template = NOTIFICATION_TEMPLATES["reservation_overdue"]
            
            notification = NotificationCreate(
                type=NotificationType.SYSTEM,
                recipient_id=data["userId"],
                title=template["title_template"],
                message=template["message_template"].format(
                    book_title=data.get("bookTitle", "Book"),
                    due_date=data.get("dueDate", "")
                ),
                priority=NotificationPriority.HIGH,
                data={"event_type": "reservation_overdue", "reservation_data": data}
            )
            
            await notification_service.create_notification(notification)
            logger.info(f"Created overdue notification for {data['userId']}")
            
        except Exception as e:
            logger.error(f"Error creating reservation overdue notification: {e}")

    def disconnect(self):
        """Disconnect from RabbitMQ"""
        try:
            if self.connection and not self.connection.is_closed:
                self.connection.close()
                logger.info("Disconnected from RabbitMQ")
        except Exception as e:
            logger.error(f"Error disconnecting from RabbitMQ: {e}")


# Global event service instance
event_service = EventService() 