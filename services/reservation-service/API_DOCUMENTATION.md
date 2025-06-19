# Reservation Service API Documentation

## Overview
The Reservation Service handles book borrowing, returns, and reservation management for the Library Management System. It provides endpoints for creating reservations, managing returns, extending due dates, and tracking overdue items.

**Base URL**: `http://localhost:3000/api/v1`  
**Port**: 3000  
**Database**: SQLite3 (development) / PostgreSQL (production)

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Rate Limiting
- **General endpoints**: 100 requests per 15 minutes per IP
- **Reservation creation**: 20 requests per 15 minutes per IP
- **Invalid token attempts**: 5 requests per 15 minutes per IP

## Business Rules
- **Maximum books per user**: 5 active reservations
- **Maximum reservation period**: 14 days
- **Reservation statuses**: active, returned, overdue

---

## Endpoints

### 1. Create Reservation
**POST** `/reservations`

Create a new book reservation for a user.

#### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "userId": "user-uuid",
  "bookId": "book-uuid",
  "dueDate": "2024-01-29T23:59:59Z"
}
```

#### Happy Scenario Response (201 Created)
```json
{
  "success": true,
  "message": "Reservation created successfully",
  "data": {
    "reservation": {
      "id": "reservation-uuid",
      "user_id": "user-uuid",
      "book_id": "book-uuid",
      "reserved_at": "2024-01-15T10:30:00.000Z",
      "due_date": "2024-01-29T23:59:59.000Z",
      "returned_at": null,
      "status": "active",
      "days_until_due": 14,
      "days_overdue": 0,
      "is_overdue": false,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Missing Required Fields (400 Bad Request)**
```json
{
  "success": false,
  "message": "User ID and Book ID are required"
}
```

**Maximum Reservations Exceeded (400 Bad Request)**
```json
{
  "success": false,
  "message": "Maximum 5 active reservations allowed per user"
}
```

**Book Not Available (400 Bad Request)**
```json
{
  "success": false,
  "message": "Book is not available for reservation"
}
```

**Authentication Required (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Authorization token is required"
}
```

---

### 2. Get All Reservations
**GET** `/reservations`

Get all reservations with optional filtering and pagination.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Query Parameters
- `userId` (string, optional): Filter by user ID
- `bookId` (string, optional): Filter by book ID
- `status` (string, optional): Filter by status (active, returned, overdue)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)

#### Example Request
```
GET /api/v1/reservations?userId=user-uuid&status=active&page=1&limit=10
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Reservations retrieved successfully",
  "data": {
    "reservations": [
      {
        "id": "reservation-uuid",
        "user_id": "user-uuid",
        "book_id": "book-uuid",
        "reserved_at": "2024-01-15T10:30:00.000Z",
        "due_date": "2024-01-29T23:59:59.000Z",
        "returned_at": null,
        "status": "active",
        "days_until_due": 14,
        "days_overdue": 0,
        "is_overdue": false,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_count": 50,
      "per_page": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### 3. Get Reservation by ID
**GET** `/reservations/{id}`

Get a specific reservation by ID.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `id` (string): Reservation ID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Reservation retrieved successfully",
  "data": {
    "reservation": {
      "id": "reservation-uuid",
      "user_id": "user-uuid",
      "book_id": "book-uuid",
      "reserved_at": "2024-01-15T10:30:00.000Z",
      "due_date": "2024-01-29T23:59:59.000Z",
      "returned_at": null,
      "status": "active",
      "days_until_due": 14,
      "days_overdue": 0,
      "is_overdue": false,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Reservation Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "Reservation not found"
}
```

---

### 4. Return Book
**PUT** `/reservations/{id}/return`

Mark a reservation as returned.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `id` (string): Reservation ID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "reservation": {
      "id": "reservation-uuid",
      "user_id": "user-uuid",
      "book_id": "book-uuid",
      "reserved_at": "2024-01-15T10:30:00.000Z",
      "due_date": "2024-01-29T23:59:59.000Z",
      "returned_at": "2024-01-20T14:30:00.000Z",
      "status": "returned",
      "days_until_due": 0,
      "days_overdue": 0,
      "is_overdue": false,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-20T14:30:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Already Returned (400 Bad Request)**
```json
{
  "success": false,
  "message": "Book has already been returned"
}
```

---

### 5. Extend Due Date
**PUT** `/reservations/{id}/extend`

Extend the due date of a reservation.

#### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Path Parameters
- `id` (string): Reservation ID

#### Request Body
```json
{
  "newDueDate": "2024-02-05T23:59:59Z"
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Due date extended successfully",
  "data": {
    "reservation": {
      "id": "reservation-uuid",
      "user_id": "user-uuid",
      "book_id": "book-uuid",
      "reserved_at": "2024-01-15T10:30:00.000Z",
      "due_date": "2024-02-05T23:59:59.000Z",
      "returned_at": null,
      "status": "active",
      "days_until_due": 21,
      "days_overdue": 0,
      "is_overdue": false,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Missing New Due Date (400 Bad Request)**
```json
{
  "success": false,
  "message": "New due date is required"
}
```

**Extension Limit Exceeded (400 Bad Request)**
```json
{
  "success": false,
  "message": "Due date cannot exceed 14 days from reservation date"
}
```

---

### 6. Get User Reservations
**GET** `/reservations/user/{userId}`

Get all reservations for a specific user.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `userId` (string): User ID

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "User reservations retrieved successfully",
  "data": {
    "reservations": [
      {
        "id": "reservation-uuid",
        "user_id": "user-uuid",
        "book_id": "book-uuid",
        "reserved_at": "2024-01-15T10:30:00.000Z",
        "due_date": "2024-01-29T23:59:59.000Z",
        "returned_at": null,
        "status": "active",
        "days_until_due": 14,
        "days_overdue": 0,
        "is_overdue": false,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_count": 15,
      "per_page": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

### 7. Get Overdue Reservations
**GET** `/reservations/overdue`

Get all overdue reservations.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Overdue reservations retrieved successfully",
  "data": {
    "reservations": [
      {
        "id": "reservation-uuid",
        "user_id": "user-uuid",
        "book_id": "book-uuid",
        "reserved_at": "2024-01-01T10:30:00.000Z",
        "due_date": "2024-01-10T23:59:59.000Z",
        "returned_at": null,
        "status": "overdue",
        "days_until_due": 0,
        "days_overdue": 5,
        "is_overdue": true,
        "created_at": "2024-01-01T10:30:00.000Z",
        "updated_at": "2024-01-11T00:00:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_count": 3,
      "per_page": 10,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

---

## Health Check Endpoints

### 8. Reservation Health Check
**GET** `/reservations/health`

Check the health status of the Reservation Service with detailed metrics.

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Reservation service is healthy",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.123,
    "total_reservations": 150,
    "active_reservations": 75,
    "overdue_reservations": 5,
    "memory_usage": {
      "current": 45678912,
      "peak": 45678912
    }
  }
}
```

#### Bad Scenarios

**Service Unhealthy (500 Internal Server Error)**
```json
{
  "success": false,
  "message": "Service unhealthy",
  "error": "Database connection failed"
}
```

---

### 9. Global Health Check
**GET** `/health`

Basic health check for the entire Reservation Service.

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Reservation service is healthy",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.123,
    "total_reservations": 150,
    "active_reservations": 75,
    "overdue_reservations": 5,
    "memory_usage": {
      "current": 45678912,
      "peak": 45678912
    }
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
  "message": "Validation failed",
  "errors": [
    "Due date must be after reservation date"
  ]
}
```

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authorization token is required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Reservation not found"
}
```

#### 429 Too Many Requests
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create reservation"
}
```

---

## Events Published

The Reservation Service publishes the following events to RabbitMQ:

### reservation.created
Published when a new reservation is created.
```json
{
  "eventType": "reservation.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "reservation-service",
  "data": {
    "reservationId": "reservation-uuid",
    "userId": "user-uuid",
    "bookId": "book-uuid",
    "dueDate": "2024-01-29T23:59:59.000Z",
    "status": "active"
  }
}
```

### reservation.returned
Published when a book is returned.
```json
{
  "eventType": "reservation.returned",
  "timestamp": "2024-01-20T14:30:00.000Z",
  "source": "reservation-service",
  "data": {
    "reservationId": "reservation-uuid",
    "userId": "user-uuid",
    "bookId": "book-uuid",
    "returnDate": "2024-01-20T14:30:00.000Z",
    "status": "returned"
  }
}
```

### reservation.overdue
Published when a reservation becomes overdue.
```json
{
  "eventType": "reservation.overdue",
  "timestamp": "2024-01-30T00:00:00.000Z",
  "source": "reservation-service",
  "data": {
    "reservationId": "reservation-uuid",
    "userId": "user-uuid",
    "bookId": "book-uuid",
    "dueDate": "2024-01-29T23:59:59.000Z",
    "daysOverdue": 1,
    "status": "overdue"
  }
}
```

### reservation.extended
Published when a reservation due date is extended.
```json
{
  "eventType": "reservation.extended",
  "timestamp": "2024-01-25T10:00:00.000Z",
  "source": "reservation-service",
  "data": {
    "reservationId": "reservation-uuid",
    "userId": "user-uuid",
    "bookId": "book-uuid",
    "oldDueDate": "2024-01-29T23:59:59.000Z",
    "newDueDate": "2024-02-05T23:59:59.000Z",
    "status": "active"
  }
}
```

---

## Testing Examples

### Using cURL

#### Create a reservation
```bash
curl -X POST http://localhost:3000/api/v1/reservations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "userId": "user-uuid",
    "bookId": "book-uuid",
    "dueDate": "2024-01-29T23:59:59Z"
  }'
```

#### Get all reservations
```bash
curl -X GET "http://localhost:3000/api/v1/reservations?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Return a book
```bash
curl -X PUT http://localhost:3000/api/v1/reservations/RESERVATION_ID/return \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Extend due date
```bash
curl -X PUT http://localhost:3000/api/v1/reservations/RESERVATION_ID/extend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "newDueDate": "2024-02-05T23:59:59Z"
  }'
```

#### Get user reservations
```bash
curl -X GET http://localhost:3000/api/v1/reservations/user/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get overdue reservations
```bash
curl -X GET http://localhost:3000/api/v1/reservations/overdue \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Health check
```bash
curl -X GET http://localhost:3000/health
```

---

## Security Considerations

1. **JWT Authentication**: All endpoints except health checks require valid JWT tokens
2. **Service Token Authentication**: Internal service calls use service tokens
3. **Rate Limiting**: Prevents abuse with configurable rate limits
4. **Input Validation**: Comprehensive validation for all inputs
5. **CORS**: Configured for frontend origins only
6. **User Validation**: Cross-service user validation with User Service
7. **Book Availability**: Real-time availability checking with Book Service

---

## Inter-Service Communication

The Reservation Service communicates with other services:

### Outbound Calls
- **User Service**: Validate user existence
  - `GET /api/v1/internal/users/{id}` - Validate user
- **Book Service**: Check availability and manage inventory
  - `GET /api/v1/books/{id}/availability` - Check book availability
  - `POST /api/v1/internal/books/{id}/reserve` - Reserve book
  - `POST /api/v1/internal/books/{id}/return` - Return book

### Authentication Headers
```
X-Service-Token: internal-service-token-change-in-production
```

---

## Environment Variables

```env
# Server Configuration
PORT=3000
RAILS_ENV=development

# Database Configuration
DATABASE_URL=sqlite3:storage/development.sqlite3

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_in_production

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=library_events

# Service Communication
USER_SERVICE_URL=http://localhost:3001
BOOK_SERVICE_URL=http://localhost:8000
SERVICE_TOKEN=internal-service-token-change-in-production

# CORS Configuration
CORS_ORIGINS=http://localhost:3002,http://localhost:3004

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_PERIOD=900

# Business Rules
MAX_BOOKS_PER_USER=5
MAX_RESERVATION_DAYS=14
```

---

## Database Schema

### reservations table
```sql
CREATE TABLE reservations (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  book_id VARCHAR NOT NULL,
  reserved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date DATETIME NOT NULL,
  returned_at DATETIME NULL,
  status VARCHAR NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);

-- Indexes
CREATE INDEX index_reservations_on_user_id ON reservations (user_id);
CREATE INDEX index_reservations_on_book_id ON reservations (book_id);
CREATE INDEX index_reservations_on_status ON reservations (status);
CREATE INDEX index_reservations_on_due_date ON reservations (due_date);
CREATE INDEX index_reservations_on_user_id_and_status ON reservations (user_id, status);
CREATE INDEX index_reservations_on_book_id_and_status ON reservations (book_id, status);
```

---

## Deployment

### Docker
```bash
# Build image
docker build -t reservation-service .

# Run container
docker run -p 3000:3000 --env-file .env reservation-service
```

### Local Development
```bash
# Install dependencies
bundle install

# Setup database
rails db:create db:migrate

# Start development server
rails server -p 3000
```

---

## Contributing

1. Follow Rails conventions and best practices
2. Add proper error handling and validation
3. Include tests for new functionality
4. Update documentation for any API changes
5. Ensure proper event publishing for state changes 