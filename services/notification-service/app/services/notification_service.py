import json
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from loguru import logger
import asyncio

from app.core.database import redis_manager, async_redis_operation
from app.models.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationUpdate,
    NotificationStatus,
    NotificationType,
    NOTIFICATION_TEMPLATES
)


class NotificationService:
    def __init__(self):
        self.redis_prefix = "notification:"
        self.user_notifications_prefix = "user_notifications:"

    async def create_notification(self, notification_data: NotificationCreate) -> NotificationResponse:
        """Create a new notification"""
        try:
            redis_client = await redis_manager.get_client()
            if not redis_client:
                raise Exception("Redis connection not available")

            notification_id = str(uuid.uuid4())
            now = datetime.utcnow()

            notification = NotificationResponse(
                id=notification_id,
                type=notification_data.type,
                recipient_id=notification_data.recipient_id,
                recipient_email=notification_data.recipient_email,
                title=notification_data.title,
                message=notification_data.message,
                priority=notification_data.priority,
                status=NotificationStatus.PENDING,
                data=notification_data.data,
                created_at=now,
                updated_at=now,
                scheduled_at=notification_data.scheduled_at
            )

            # Store notification using sync operations wrapped in async
            notification_key = f"{self.redis_prefix}{notification_id}"
            
            # Use executor to run sync Redis operations
            loop = asyncio.get_event_loop()
            
            # Prepare the data for hset
            notification_hash = {
                "id": notification.id,
                "type": notification.type.value,
                "recipient_id": notification.recipient_id,
                "recipient_email": notification.recipient_email or "",
                "title": notification.title,
                "message": notification.message,
                "priority": notification.priority.value,
                "status": notification.status.value,
                "data": json.dumps(notification.data) if notification.data else "{}",
                "created_at": notification.created_at.isoformat(),
                "updated_at": notification.updated_at.isoformat(),
                "scheduled_at": notification.scheduled_at.isoformat() if notification.scheduled_at else "",
            }
            
            # Use hset with mapping parameter
            await loop.run_in_executor(None, lambda: redis_client.hset(notification_key, mapping=notification_hash))

            # Add to user's notification list
            user_key = f"{self.user_notifications_prefix}{notification.recipient_id}"
            await loop.run_in_executor(None, redis_client.zadd, user_key, {notification_id: now.timestamp()})

            logger.info(f"Created notification {notification_id} for user {notification.recipient_id}")
            return notification

        except Exception as e:
            logger.error(f"Error creating notification: {e}")
            raise

    async def get_notification(self, notification_id: str) -> Optional[NotificationResponse]:
        """Get notification by ID"""
        try:
            redis_client = await redis_manager.get_client()
            if not redis_client:
                return None

            notification_key = f"{self.redis_prefix}{notification_id}"
            loop = asyncio.get_event_loop()
            notification_data = await loop.run_in_executor(None, redis_client.hgetall, notification_key)

            if not notification_data:
                return None

            return self._parse_notification_data(notification_data)

        except Exception as e:
            logger.error(f"Error getting notification {notification_id}: {e}")
            return None

    async def get_user_notifications(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        status_filter: Optional[NotificationStatus] = None
    ) -> Dict[str, Any]:
        """Get notifications for a specific user"""
        try:
            redis_client = await redis_manager.get_client()
            if not redis_client:
                return {"notifications": [], "total": 0, "page": page, "limit": limit}

            user_key = f"{self.user_notifications_prefix}{user_id}"
            loop = asyncio.get_event_loop()
            
            # Get total count
            total = await loop.run_in_executor(None, redis_client.zcard, user_key)
            
            # Calculate pagination
            start = (page - 1) * limit
            end = start + limit - 1
            
            # Get notification IDs (newest first)
            notification_ids = await loop.run_in_executor(None, redis_client.zrevrange, user_key, start, end)
            
            notifications = []
            for notification_id in notification_ids:
                notification = await self.get_notification(notification_id)
                if notification:
                    # Apply status filter
                    if status_filter and notification.status != status_filter:
                        continue
                    notifications.append(notification)

            return {
                "notifications": notifications,
                "total": total,
                "page": page,
                "limit": limit,
                "has_next": end < total - 1,
                "has_prev": page > 1
            }

        except Exception as e:
            logger.error(f"Error getting user notifications for {user_id}: {e}")
            return {"notifications": [], "total": 0, "page": page, "limit": limit}

    async def update_notification(
        self,
        notification_id: str,
        update_data: NotificationUpdate
    ) -> Optional[NotificationResponse]:
        """Update notification"""
        try:
            redis_client = await redis_manager.get_client()
            if not redis_client:
                return None

            notification_key = f"{self.redis_prefix}{notification_id}"
            loop = asyncio.get_event_loop()
            notification_data = await loop.run_in_executor(None, redis_client.hgetall, notification_key)

            if not notification_data:
                return None

            # Update fields
            now = datetime.utcnow()
            if update_data.status:
                notification_data["status"] = update_data.status.value
                if update_data.status == NotificationStatus.SENT:
                    notification_data["sent_at"] = now.isoformat()
            
            if update_data.read_at:
                notification_data["read_at"] = update_data.read_at.isoformat()
                notification_data["status"] = NotificationStatus.READ.value

            notification_data["updated_at"] = now.isoformat()

            # Save updated notification
            await loop.run_in_executor(None, lambda: redis_client.hset(notification_key, mapping=notification_data))

            return self._parse_notification_data(notification_data)

        except Exception as e:
            logger.error(f"Error updating notification {notification_id}: {e}")
            return None

    async def mark_as_read(self, notification_id: str) -> Optional[NotificationResponse]:
        """Mark notification as read"""
        update_data = NotificationUpdate(
            status=NotificationStatus.READ,
            read_at=datetime.utcnow()
        )
        return await self.update_notification(notification_id, update_data)

    async def mark_as_sent(self, notification_id: str) -> Optional[NotificationResponse]:
        """Mark notification as sent"""
        update_data = NotificationUpdate(status=NotificationStatus.SENT)
        return await self.update_notification(notification_id, update_data)

    async def mark_as_failed(self, notification_id: str) -> Optional[NotificationResponse]:
        """Mark notification as failed"""
        update_data = NotificationUpdate(status=NotificationStatus.FAILED)
        return await self.update_notification(notification_id, update_data)

    async def delete_notification(self, notification_id: str) -> bool:
        """Delete notification"""
        try:
            redis_client = await redis_manager.get_client()
            if not redis_client:
                return False

            # Get notification to find user ID
            notification = await self.get_notification(notification_id)
            if not notification:
                return False

            loop = asyncio.get_event_loop()
            
            # Remove from notification hash
            notification_key = f"{self.redis_prefix}{notification_id}"
            await loop.run_in_executor(None, redis_client.delete, notification_key)

            # Remove from user's notification list
            user_key = f"{self.user_notifications_prefix}{notification.recipient_id}"
            await loop.run_in_executor(None, redis_client.zrem, user_key, notification_id)

            logger.info(f"Deleted notification {notification_id}")
            return True

        except Exception as e:
            logger.error(f"Error deleting notification {notification_id}: {e}")
            return False

    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for user"""
        try:
            notifications_data = await self.get_user_notifications(
                user_id, page=1, limit=1000  # Get all notifications
            )
            
            unread_count = 0
            for notification in notifications_data["notifications"]:
                if notification.status not in [NotificationStatus.READ]:
                    unread_count += 1
            
            return unread_count

        except Exception as e:
            logger.error(f"Error getting unread count for {user_id}: {e}")
            return 0

    async def cleanup_old_notifications(self, days: int = 30) -> int:
        """Clean up notifications older than specified days"""
        try:
            redis_client = await redis_manager.get_client()
            if not redis_client:
                return 0

            cutoff_date = datetime.utcnow() - timedelta(days=days)
            cutoff_timestamp = cutoff_date.timestamp()
            loop = asyncio.get_event_loop()

            # Get all user notification keys
            pattern = f"{self.user_notifications_prefix}*"
            user_keys = await loop.run_in_executor(None, lambda: list(redis_client.scan_iter(match=pattern)))

            deleted_count = 0
            for user_key in user_keys:
                # Get old notification IDs
                old_notification_ids = await loop.run_in_executor(
                    None, redis_client.zrangebyscore, user_key, 0, cutoff_timestamp
                )
                
                for notification_id in old_notification_ids:
                    # Delete the notification
                    notification_key = f"{self.redis_prefix}{notification_id}"
                    await loop.run_in_executor(None, redis_client.delete, notification_key)
                    deleted_count += 1

                # Remove from user list
                await loop.run_in_executor(None, redis_client.zremrangebyscore, user_key, 0, cutoff_timestamp)

            logger.info(f"Cleaned up {deleted_count} old notifications")
            return deleted_count

        except Exception as e:
            logger.error(f"Error cleaning up old notifications: {e}")
            return 0

    def _parse_notification_data(self, data: Dict[str, str]) -> NotificationResponse:
        """Parse notification data from Redis"""
        return NotificationResponse(
            id=data["id"],
            type=NotificationType(data["type"]),
            recipient_id=data["recipient_id"],
            recipient_email=data["recipient_email"] if data["recipient_email"] else None,
            title=data["title"],
            message=data["message"],
            priority=data["priority"],
            status=NotificationStatus(data["status"]),
            data=json.loads(data["data"]) if data.get("data") else None,
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            sent_at=datetime.fromisoformat(data["sent_at"]) if data.get("sent_at") else None,
            read_at=datetime.fromisoformat(data["read_at"]) if data.get("read_at") else None,
            scheduled_at=datetime.fromisoformat(data["scheduled_at"]) if data.get("scheduled_at") else None
        )

    def get_notification_templates(self) -> Dict[str, Any]:
        """Get all notification templates"""
        return NOTIFICATION_TEMPLATES


# Global notification service instance
notification_service = NotificationService() 