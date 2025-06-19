# Notification Service API Documentation

## Overview
The Notification Service handles notifications and events for the Library Management System. It provides endpoints for notification management, event processing, and system communication with Redis storage and RabbitMQ event consumption.

**Base URL**: `http://localhost:8001/api/v1`  
**Port**: 8001  
**Database**: Redis (notifications and user notifications)

## Authentication
The service supports dual authentication modes:
```
Authorization: Bearer <access_token>
X-Service-Token: <service_token>
```

## Rate Limiting
- **General endpoints**: 60 requests per minute per IP
- **Burst limit**: 100 requests for short bursts

## Roles and Permissions
- **User**: Can view/manage own notifications
- **Admin/Librarian**: Can view all notifications and access templates
- **Super Admin**: Full access including cleanup operations
- **Service**: Internal service-to-service communication

---

## Endpoints

### 1. Send Notification (Service-to-Service)
**POST** `/notifications/send`

Send a notification to a user (internal service endpoint).

#### Headers
```
X-Service-Token: <service_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "type": "system",
  "recipient": "user-id-123",
  "title": "Book Reserved",
  "message": "Your book reservation has been confirmed",
  "priority": "medium",
  "data": {
    "book_id": "book-123",
    "due_date": "2024-02-15"
  }
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Notification sent successfully",
  "data": {
    "notification_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

#### Bad Scenarios

**Missing Service Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Service token required"
}
```

**Invalid Service Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid service token"
}
```

**Validation Error (422 Unprocessable Entity)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "type",
      "message": "Type must be one of: email, system, push, sms"
    }
  ]
}
```

---

### 2. Get User Notifications
**GET** `/notifications/user/{user_id}`

Get notifications for a specific user with pagination and filtering.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `user_id` (string): User ID

#### Query Parameters
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status (pending, sent, failed, read)

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "type": "system",
        "recipient_id": "user-123",
        "recipient_email": null,
        "title": "Book Reserved",
        "message": "Your book reservation has been confirmed",
        "priority": "medium",
        "status": "sent",
        "data": {
          "book_id": "book-123",
          "due_date": "2024-02-15"
        },
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z",
        "sent_at": "2024-01-15T10:30:01.000Z",
        "read_at": null,
        "scheduled_at": null
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 20,
    "has_next": true,
    "has_prev": false
  }
}
```

#### Bad Scenarios

**Access Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Invalid Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Token has expired"
}
```

---

### 3. Get Notification by ID
**GET** `/notifications/{notification_id}`

Get a specific notification by its ID.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `notification_id` (string): Notification ID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Notification retrieved successfully",
  "data": {
    "notification": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "system",
      "recipient_id": "user-123",
      "recipient_email": null,
      "title": "Book Reserved",
      "message": "Your book reservation has been confirmed",
      "priority": "medium",
      "status": "sent",
      "data": {
        "book_id": "book-123",
        "due_date": "2024-02-15"
      },
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "sent_at": "2024-01-15T10:30:01.000Z",
      "read_at": null,
      "scheduled_at": null
    }
  }
}
```

#### Bad Scenarios

**Notification Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

**Access Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Access denied"
}
```

---

### 4. Mark Notification as Read
**PUT** `/notifications/{notification_id}/read`

Mark a notification as read.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `notification_id` (string): Notification ID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "notification": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "system",
      "recipient_id": "user-123",
      "title": "Book Reserved",
      "message": "Your book reservation has been confirmed",
      "priority": "medium",
      "status": "read",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T11:00:00.000Z",
      "read_at": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Access Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Notification Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

---

### 5. Delete Notification
**DELETE** `/notifications/{notification_id}`

Delete a notification.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `notification_id` (string): Notification ID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

#### Bad Scenarios

**Access Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**Notification Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "Notification not found"
}
```

---

### 6. Get Unread Count
**GET** `/notifications/user/{user_id}/unread-count`

Get the count of unread notifications for a user.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `user_id` (string): User ID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "unread_count": 5
  }
}
```

#### Bad Scenarios

**Access Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Access denied"
}
```

---

### 7. Get Notification Templates
**GET** `/notifications/templates`

Get all available notification templates (admin only).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Templates retrieved successfully",
  "data": {
    "templates": {
      "user_registered": {
        "name": "User Registration",
        "type": "email",
        "title_template": "Welcome to Library Management System!",
        "message_template": "Hello {first_name}, welcome to our library!",
        "variables": ["first_name", "email"]
      },
      "reservation_created": {
        "name": "Book Reserved",
        "type": "system",
        "title_template": "Book Reserved Successfully",
        "message_template": "You have successfully reserved '{book_title}' by {book_author}. Due date: {due_date}",
        "variables": ["book_title", "book_author", "due_date"]
      }
    }
  }
}
```

#### Bad Scenarios

**Admin Access Required (403 Forbidden)**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

### 8. Cleanup Old Notifications
**POST** `/notifications/cleanup`

Clean up old notifications (admin only).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Query Parameters
- `days` (integer, optional): Delete notifications older than this many days (default: 30, max: 365)

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Cleaned up 150 old notifications",
  "data": {
    "deleted_count": 150
  }
}
```

#### Bad Scenarios

**Admin Access Required (403 Forbidden)**
```json
{
  "success": false,
  "message": "Admin access required"
}
```

---

### 9. Health Check
**GET** `/notifications/health`

Check the health status of the Notification Service.

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Notification service is healthy",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "status": "healthy",
    "database": "connected"
  }
}
```

#### Bad Scenarios

**Service Unhealthy (503 Service Unavailable)**
```json
{
  "success": false,
  "message": "Service unhealthy - Redis connection failed"
}
```

---

### 10. Global Health Check
**GET** `/health`

Global health check for the entire service.

#### Happy Scenario Response (200 OK)
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

#### Bad Scenarios

**Service Degraded (503 Service Unavailable)**
```json
{
  "success": true,
  "message": "Notification Service is degraded",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "status": "degraded",
    "services": {
      "redis": "connected",
      "rabbitmq": "disconnected"
    },
    "environment": "development"
  }
}
```

---

## Error Handling

### Common Error Responses

#### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data",
  "detail": "Detailed error message"
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token has expired"
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Notification not found"
}
```

#### 422 Unprocessable Entity
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "type",
      "message": "Field validation error"
    }
  ]
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Rate limit exceeded"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "detail": "Error details (debug mode only)"
}
```

#### 503 Service Unavailable
```json
{
  "success": false,
  "message": "Service unhealthy",
  "error": "Redis connection failed"
}
```

---

## Events Consumed

The Notification Service consumes the following events from RabbitMQ:

### user.registered
Consumed from User Service when a new user registers.
```json
{
  "eventType": "user.registered",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "user-service",
  "data": {
    "userId": "user-123",
    "email": "user@example.com",
    "firstName": "John"
  }
}
```

### user.suspended
Consumed from Admin Service when a user is suspended.
```json
{
  "eventType": "user.suspended",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "source": "admin-service",
  "data": {
    "userId": "user-123",
    "suspendedBy": "admin-456",
    "reason": "Overdue books"
  }
}
```

### admin.registered
Consumed from Admin Service when a new admin is registered.
```json
{
  "eventType": "admin.registered",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "admin-service",
  "data": {
    "adminId": "admin-123",
    "email": "admin@library.com",
    "firstName": "Jane",
    "role": "admin",
    "createdBy": {
      "adminId": "admin-456",
      "email": "super@library.com"
    }
  }
}
```

### reservation.created
Consumed from Reservation Service when a book is reserved.
```json
{
  "eventType": "reservation.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "reservation-service",
  "data": {
    "reservationId": "res-123",
    "userId": "user-123",
    "bookId": "book-456",
    "dueDate": "2024-02-15T23:59:59.000Z"
  }
}
```

### reservation.returned
Consumed from Reservation Service when a book is returned.
```json
{
  "eventType": "reservation.returned",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "reservation-service",
  "data": {
    "reservationId": "res-123",
    "userId": "user-123",
    "bookId": "book-456",
    "returnDate": "2024-01-20T10:30:00.000Z"
  }
}
```

### reservation.overdue
Consumed from Reservation Service when a book becomes overdue.
```json
{
  "eventType": "reservation.overdue",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "reservation-service",
  "data": {
    "reservationId": "res-123",
    "userId": "user-123",
    "bookId": "book-456",
    "dueDate": "2024-01-10T23:59:59.000Z"
  }
}
```

---

## Testing Examples

### Using cURL

#### Send notification (service-to-service)
```bash
curl -X POST http://localhost:8001/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: internal-service-token" \
  -d '{
    "type": "system",
    "recipient": "user-123",
    "title": "Book Reserved",
    "message": "Your book has been reserved successfully",
    "priority": "medium"
  }'
```

#### Get user notifications
```bash
curl -X GET "http://localhost:8001/api/v1/notifications/user/user-123?page=1&limit=10" \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

#### Mark notification as read
```bash
curl -X PUT http://localhost:8001/api/v1/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

#### Get unread count
```bash
curl -X GET http://localhost:8001/api/v1/notifications/user/user-123/unread-count \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

#### Get templates (admin)
```bash
curl -X GET http://localhost:8001/api/v1/notifications/templates \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

#### Cleanup old notifications (admin)
```bash
curl -X POST "http://localhost:8001/api/v1/notifications/cleanup?days=30" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Using Python

```python
import httpx

# Send notification (service call)
response = httpx.post(
    "http://localhost:8001/api/v1/notifications/send",
    headers={"X-Service-Token": "internal-service-token"},
    json={
        "type": "system",
        "recipient": "user-123",
        "title": "Welcome!",
        "message": "Welcome to the library system",
        "priority": "medium"
    }
)

# Get user notifications
response = httpx.get(
    "http://localhost:8001/api/v1/notifications/user/user-123",
    headers={"Authorization": "Bearer JWT_TOKEN"},
    params={"page": 1, "limit": 20}
)
```

---

## Security Considerations

1. **JWT Authentication**: Secure token-based authentication for user endpoints
2. **Service Token Authentication**: Internal API protection with service tokens
3. **Rate Limiting**: Protection against abuse and DDoS attacks
4. **Input Validation**: Comprehensive validation using Pydantic models
5. **CORS Configuration**: Properly configured cross-origin requests
6. **Error Handling**: Secure error messages without sensitive data exposure
7. **User Access Control**: Users can only access their own notifications
8. **Admin Role Verification**: Protected admin endpoints with role checking

---

## Database Schema (Redis)

### Notification Storage
```redis
# Hash for each notification
notification:{notification_id}
  id: "notification-uuid"
  type: "system"
  recipient_id: "user-123"
  recipient_email: ""
  title: "Notification Title"
  message: "Notification Message"
  priority: "medium"
  status: "pending"
  data: "{\"key\": \"value\"}"
  created_at: "2024-01-15T10:30:00.000000"
  updated_at: "2024-01-15T10:30:00.000000"
  sent_at: ""
  read_at: ""
  scheduled_at: ""

# Sorted set for user notifications (sorted by timestamp)
user_notifications:{user_id}
  notification_id_1: timestamp_1
  notification_id_2: timestamp_2
  ...
```

---

## Performance Considerations

1. **Redis Optimization**: Efficient data structures and indexing
2. **Pagination**: Proper pagination for large notification lists
3. **Connection Pooling**: Optimized Redis connections
4. **Async Processing**: Non-blocking I/O operations
5. **Event Processing**: Efficient RabbitMQ message consumption
6. **Cleanup Jobs**: Regular cleanup of old notifications

---

## Monitoring and Logging

- **Health Checks**: Multiple health check endpoints
- **Structured Logging**: JSON formatted logs with correlation IDs
- **Error Tracking**: Comprehensive error logging and tracking
- **Performance Metrics**: Request duration and throughput monitoring
- **Event Processing**: Monitoring of event consumption and processing

---

## Troubleshooting

### Common Issues

1. **Redis Connection Error**:
   - Check Redis service status
   - Verify connection string in environment variables
   - Check network connectivity

2. **RabbitMQ Connection Error**:
   - Verify RabbitMQ is running
   - Check credentials and connection parameters
   - Service will degrade gracefully without RabbitMQ

3. **JWT Token Issues**:
   - Verify JWT secret matches other services
   - Check token expiration and format
   - Ensure proper Authorization header format

4. **Permission Errors**:
   - Verify user roles and permissions
   - Check token payload for role information
   - Ensure proper access control logic

### Debug Mode

Enable debug mode for detailed logs:
```env
DEBUG=true
LOG_LEVEL=DEBUG
```

---

## Environment Variables

```env
# Server Configuration
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development
DEBUG=true

# Database
REDIS_URL=redis://localhost:6379/0

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=library_events

# Authentication
JWT_SECRET=your_jwt_secret_here
SERVICE_TOKEN=internal-service-token

# CORS
CORS_ORIGINS=["http://localhost:3002", "http://localhost:3004"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_BURST=100
```

---

## Contributing

1. Follow FastAPI and Pydantic best practices
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Use proper error handling and logging
5. Maintain backward compatibility when possible 