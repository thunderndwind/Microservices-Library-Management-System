# Notification Service

The Notification Service is a FastAPI-based microservice that handles notifications and events for the Library Management System. It manages system notifications, processes events from other services, and provides a comprehensive notification management system.

## 🚀 Features

### Core Functionality
- **Notification Management**: Create, read, update, and delete notifications
- **Event Processing**: Consume and process events from RabbitMQ
- **User Notifications**: Personal notification feeds for users
- **Real-time Processing**: Asynchronous event consumption and processing
- **Template System**: Predefined notification templates

### Notification Types
- **System Notifications**: In-app notifications for user actions
- **Email Notifications**: Email-based notifications (future enhancement)
- **Push Notifications**: Mobile push notifications (future enhancement)
- **SMS Notifications**: Text message notifications (future enhancement)

### Event-Driven Architecture
- **User Events**: Registration, suspension, profile updates
- **Admin Events**: Admin registration and system actions
- **Book Events**: Book creation, updates, and management
- **Reservation Events**: Book reservations, returns, and overdue notifications

## 🏗️ Architecture

### Technology Stack
- **Framework**: FastAPI 0.104.1
- **Language**: Python 3.12
- **Database**: Redis (for notifications storage)
- **Message Queue**: RabbitMQ (for event consumption)
- **Authentication**: JWT tokens + Service tokens
- **Validation**: Pydantic models
- **Logging**: Loguru with structured logging

### Design Patterns
- **Repository Pattern**: Data access abstraction
- **Event Sourcing**: Event-driven notification creation
- **Template Pattern**: Notification templates with variables
- **Strategy Pattern**: Multiple notification types and delivery methods

## 📋 Prerequisites

- Python 3.12+
- Redis 6.0+
- RabbitMQ 3.8+
- Virtual environment (recommended)

## 🛠️ Installation

### 1. Clone and Setup
```bash
cd services/notification-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
```bash
cp env.example .env
# Edit .env with your configuration
```

### 4. Start Required Services
```bash
# Start Redis
sudo systemctl start redis
# or
redis-server

# Start RabbitMQ
sudo systemctl start rabbitmq-server
# or
rabbitmq-server
```

### 5. Run the Service
```bash
# Development mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Production mode
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## 🐳 Docker Setup

### Build and Run
```bash
# Build the image
docker build -t notification-service .

# Run the container
docker run -d \
  --name notification-service \
  -p 8001:8001 \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e RABBITMQ_URL=amqp://host.docker.internal:5672 \
  -e JWT_SECRET=your_jwt_secret \
  notification-service
```

## ⚙️ Configuration

### Environment Variables

```env
# Server Configuration
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development
DEBUG=true
PROJECT_NAME=Notification Service
API_VERSION=v1

# Database Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_EXCHANGE=library_events

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256

# Service Authentication
SERVICE_TOKEN=internal-service-token

# External Services
USER_SERVICE_URL=http://localhost:3001
ADMIN_SERVICE_URL=http://localhost:3003
BOOK_SERVICE_URL=http://localhost:8000
RESERVATION_SERVICE_URL=http://localhost:3000

# CORS
CORS_ORIGINS=["http://localhost:3002", "http://localhost:3004"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=100

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/notification-service.log
```

## 📚 API Documentation

### API Endpoints Overview

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/` | GET | Service information | No |
| `/health` | GET | Global health check | No |
| `/api/v1/notifications/send` | POST | Send notification | Service Token |
| `/api/v1/notifications/user/{user_id}` | GET | Get user notifications | JWT |
| `/api/v1/notifications/{id}` | GET | Get notification by ID | JWT |
| `/api/v1/notifications/{id}/read` | PUT | Mark as read | JWT |
| `/api/v1/notifications/{id}` | DELETE | Delete notification | JWT |
| `/api/v1/notifications/user/{user_id}/unread-count` | GET | Get unread count | JWT |
| `/api/v1/notifications/templates` | GET | Get templates | Admin JWT |
| `/api/v1/notifications/cleanup` | POST | Cleanup old notifications | Admin JWT |
| `/api/v1/notifications/health` | GET | Service health check | No |

### Service-to-Service Communication

**Send Notification**
```bash
curl -X POST http://localhost:8001/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: internal-service-token" \
  -d '{
    "type": "system",
    "recipient": "user-123",
    "title": "Book Reserved",
    "message": "Your book has been reserved successfully",
    "priority": "medium",
    "data": {"book_id": "book-456"}
  }'
```

**Response**
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "notification_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## 🎯 Event Processing

### Consumed Events

The service automatically processes these events from RabbitMQ:

#### User Events
- `user.registered` - Creates welcome notification
- `user.suspended` - Creates suspension notification

#### Admin Events  
- `admin.registered` - Creates admin welcome notification

#### Reservation Events
- `reservation.created` - Creates reservation confirmation
- `reservation.returned` - Creates return confirmation
- `reservation.overdue` - Creates overdue notification

### Event Queue Structure
```
Exchange: library_events (topic)
├── user_events queue
│   ├── user.registered
│   ├── user.suspended
│   └── user.profile_updated
├── admin_events queue
│   ├── admin.registered
│   └── admin.login
├── book_events queue
│   ├── book.created
│   ├── book.updated
│   └── book.deleted
└── reservation_events queue
    ├── reservation.created
    ├── reservation.returned
    ├── reservation.overdue
    └── reservation.extended
```

## 📧 Notification Templates

### Built-in Templates

1. **User Registration**
   - Type: Email/System
   - Variables: `{first_name}`, `{email}`
   - Message: Welcome new users

2. **Book Reserved**
   - Type: System
   - Variables: `{book_title}`, `{book_author}`, `{due_date}`
   - Message: Confirm book reservation

3. **Book Due Soon**
   - Type: System
   - Variables: `{book_title}`, `{due_date}`
   - Message: Remind about due date

4. **Book Overdue**
   - Type: System  
   - Variables: `{book_title}`, `{due_date}`
   - Message: Alert about overdue book

5. **Book Returned**
   - Type: System
   - Variables: `{book_title}`
   - Message: Confirm book return

6. **Account Suspended**
   - Type: System
   - Variables: `{reason}`
   - Message: Notify about suspension

## 🗄️ Database Schema

### Redis Data Structure

```redis
# Individual notification
notification:{uuid}
  id: "notification-uuid"
  type: "system"
  recipient_id: "user-123"
  title: "Notification Title"
  message: "Notification Message"
  priority: "medium"
  status: "pending"
  created_at: "2024-01-15T10:30:00.000000"
  # ... other fields

# User notification index (sorted set by timestamp)
user_notifications:{user_id}
  notification_id_1: timestamp_1
  notification_id_2: timestamp_2
  # ...sorted by creation time
```

## 🔐 Security Features

### Authentication
- **JWT Authentication**: User token validation
- **Service Token**: Internal service authentication
- **Role-based Access**: User, Admin, Super Admin permissions

### Security Measures
- **Input Validation**: Pydantic model validation
- **Rate Limiting**: Request throttling
- **CORS Protection**: Cross-origin request control
- **Secure Headers**: Security headers in responses
- **Error Handling**: Secure error messages

### Access Control
- Users can only access their own notifications
- Admins can access all notifications and templates
- Super admins have full cleanup access
- Service tokens for internal communication

## 📊 Monitoring & Health Checks

### Health Endpoints
- `/health` - Global service health
- `/api/v1/notifications/health` - Detailed health check

### Health Check Response
```json
{
  "success": true,
  "message": "Notification Service is healthy",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "status": "healthy",
    "services": {
      "redis": "connected",
      "rabbitmq": "connected"
    },
    "environment": "development"
  }
}
```

### Monitoring Features
- **Structured Logging**: JSON formatted logs
- **Health Monitoring**: Continuous health checks
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Request duration tracking

## 🧪 Testing

### Unit Tests
```bash
# Run tests
python -m pytest

# Run with coverage
python -m pytest --cov=app

# Run specific test file
python -m pytest tests/test_notification_service.py
```

### Integration Testing
```bash
# Test notification creation
curl -X POST http://localhost:8001/api/v1/notifications/send \
  -H "X-Service-Token: internal-service-token" \
  -H "Content-Type: application/json" \
  -d '{"type": "system", "recipient": "test-user", "title": "Test", "message": "Test message"}'

# Test user notifications
curl -X GET http://localhost:8001/api/v1/notifications/user/test-user \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Load Testing
```bash
# Using siege
siege -c 10 -t 30s http://localhost:8001/health

# Using apache bench
ab -n 1000 -c 10 http://localhost:8001/health
```

## 🚀 Deployment

### Development
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Production
```bash
# Using Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8001

# Using Docker
docker run -d -p 8001:8001 --name notification-service notification-service:latest
```

### Environment-specific Configuration
```env
# Development
DEBUG=true
LOG_LEVEL=DEBUG

# Production  
DEBUG=false
LOG_LEVEL=INFO
ENVIRONMENT=production
```

## 🔧 Maintenance

### Database Cleanup
```bash
# Cleanup old notifications (30 days)
curl -X POST "http://localhost:8001/api/v1/notifications/cleanup?days=30" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Log Management
- Logs rotate daily
- 30-day retention policy
- Structured JSON format for parsing

### Performance Optimization
- Redis connection pooling
- Async I/O operations
- Efficient pagination
- Background event processing

## 🐛 Troubleshooting

### Common Issues

**Redis Connection Failed**
```bash
# Check Redis status
sudo systemctl status redis
redis-cli ping

# Check connection string
echo $REDIS_URL
```

**RabbitMQ Connection Issues**
```bash
# Check RabbitMQ status
sudo systemctl status rabbitmq-server
rabbitmq-diagnostics status

# Check queues
rabbitmqctl list_queues
```

**JWT Token Issues**
- Verify JWT secret matches other services
- Check token expiration
- Validate token format

**Permission Errors**
- Check user roles in JWT payload
- Verify access control logic
- Confirm user ID matching

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true
export LOG_LEVEL=DEBUG

# Run with debug output
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload --log-level debug
```

## 📈 Performance Considerations

### Optimization Features
- **Async Operations**: Non-blocking I/O
- **Connection Pooling**: Efficient Redis connections
- **Pagination**: Memory-efficient data retrieval
- **Background Processing**: Async event consumption
- **Caching**: Redis-based notification storage

### Scalability
- Horizontal scaling support
- Stateless design
- Event-driven architecture
- Microservice isolation

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Setup development environment
4. Write tests for new features
5. Submit pull request

### Code Standards
- Follow PEP 8 style guide
- Use type hints
- Write comprehensive docstrings
- Maintain test coverage above 80%

### Commit Convention
```
feat: add new notification template
fix: resolve Redis connection issue
docs: update API documentation
test: add integration tests
```

## 📄 License

This project is part of the Library Management System and follows the same licensing terms.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review API documentation
- Check service logs
- Contact the development team

---

## Quick Start Commands

```bash
# Setup and run
cd services/notification-service
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp env.example .env
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload

# Test health
curl http://localhost:8001/health

# Send test notification  
curl -X POST http://localhost:8001/api/v1/notifications/send \
  -H "X-Service-Token: internal-service-token" \
  -H "Content-Type: application/json" \
  -d '{"type": "system", "recipient": "test", "title": "Test", "message": "Test message"}'
``` 