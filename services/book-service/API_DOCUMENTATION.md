# Book Service API Documentation

## Overview
The Book Service manages the book catalog for the Library Management System. It provides endpoints for book management, search functionality, and availability tracking with role-based access control.

**Base URL**: `http://localhost:8000/api/v1`  
**Port**: 8000  
**Database**: MySQL (`library_books` database)  
**Framework**: Laravel 11 (PHP)

## Authentication

The Book Service uses JWT tokens for authentication and supports service-to-service communication.

### Authentication Methods
1. **JWT Bearer Token**: For admin/librarian access
2. **Service Token**: For inter-service communication (X-Service-Token header)

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
X-Service-Token: <service_token> (for internal calls)
```

---

## API Endpoints

### 1. Health Check
**GET** `/health`

Check the health status of the Book Service.

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Book service is healthy",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.123,
    "total_books": 1250,
    "available_books": 890,
    "memory_usage": {
      "current": 52428800,
      "peak": 67108864
    }
  }
}
```

#### Bad Scenario Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Service unhealthy",
  "error": "Database connection failed"
}
```

---

### 2. Get All Books
**GET** `/books`

Retrieve all books with pagination and optional search.

#### Query Parameters
- `limit` (optional): Number of books per page (max 100, default 10)
- `page` (optional): Page number (default 1)
- `search` (optional): Search query for title, author, or ISBN

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Books retrieved successfully",
  "data": {
    "books": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "description": "A classic American novel set in the Jazz Age",
        "quantity": 5,
        "available_quantity": 3,
        "created_by": "admin-id-123",
        "updated_by": "admin-id-123",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 125,
      "total_books": 1250,
      "per_page": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### Bad Scenario Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Failed to retrieve books"
}
```

---

### 3. Get Book by ID
**GET** `/books/{id}`

Retrieve a specific book by its ID.

#### Path Parameters
- `id`: Book UUID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Book retrieved successfully",
  "data": {
    "book": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "isbn": "9780743273565",
      "description": "A classic American novel set in the Jazz Age",
      "quantity": 5,
      "available_quantity": 3,
      "created_by": "admin-id-123",
      "updated_by": "admin-id-123",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Bad Scenario Response (404 Not Found)
```json
{
  "success": false,
  "message": "Book not found"
}
```

---

### 4. Search Books
**GET** `/books/search`

Search books by query and type.

#### Query Parameters
- `q` (required): Search query
- `type` (optional): Search type - `title`, `author`, `isbn`, or `all` (default)
- `limit` (optional): Number of results per page (max 100, default 10)
- `page` (optional): Page number (default 1)

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Search completed successfully",
  "data": {
    "books": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "isbn": "9780743273565",
        "description": "A classic American novel set in the Jazz Age",
        "quantity": 5,
        "available_quantity": 3,
        "created_by": "admin-id-123",
        "updated_by": "admin-id-123",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "search_query": "gatsby",
    "search_type": "all",
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_books": 1,
      "per_page": 10,
      "has_next": false,
      "has_prev": false
    }
  }
}
```

#### Bad Scenario Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Search query is required"
}
```

---

### 5. Check Book Availability
**GET** `/books/{id}/availability`

Check the availability status of a specific book.

#### Path Parameters
- `id`: Book UUID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Book availability retrieved successfully",
  "data": {
    "book_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "The Great Gatsby",
    "total_quantity": 5,
    "available_quantity": 3,
    "reserved_quantity": 2,
    "is_available": true,
    "availability_status": "available"
  }
}
```

#### Bad Scenario Response (404 Not Found)
```json
{
  "success": false,
  "message": "Book not found"
}
```

---

### 6. Create Book
**POST** `/books`

Create a new book (requires authentication - Admin/Librarian only).

#### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "title": "To Kill a Mockingbird",
  "author": "Harper Lee",
  "isbn": "9780061120084",
  "description": "A gripping tale of racial injustice and childhood innocence",
  "quantity": 3
}
```

#### Happy Scenario Response (201 Created)
```json
{
  "success": true,
  "message": "Book created successfully",
  "data": {
    "book": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "To Kill a Mockingbird",
      "author": "Harper Lee",
      "isbn": "9780061120084",
      "description": "A gripping tale of racial injustice and childhood innocence",
      "quantity": 3,
      "available_quantity": 3,
      "created_by": "admin-id-123",
      "updated_by": "admin-id-123",
      "created_at": "2024-01-15T11:00:00.000Z",
      "updated_at": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

#### Bad Scenario Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": ["The title field is required."],
    "author": ["The author field is required."],
    "isbn": ["The isbn must be 10 or 13 characters."],
    "quantity": ["The quantity must be at least 1."]
  }
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authorization token is required"
}
```

**409 Conflict - Duplicate ISBN**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "isbn": ["The isbn has already been taken."]
  }
}
```

---

### 7. Update Book
**PUT** `/books/{id}`

Update an existing book (requires authentication - Admin/Librarian only).

#### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Path Parameters
- `id`: Book UUID

#### Request Body
```json
{
  "title": "To Kill a Mockingbird (Updated Edition)",
  "author": "Harper Lee",
  "isbn": "9780061120084",
  "description": "A gripping tale of racial injustice and childhood innocence - Updated",
  "quantity": 5
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Book updated successfully",
  "data": {
    "book": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "title": "To Kill a Mockingbird (Updated Edition)",
      "author": "Harper Lee",
      "isbn": "9780061120084",
      "description": "A gripping tale of racial injustice and childhood innocence - Updated",
      "quantity": 5,
      "available_quantity": 5,
      "created_by": "admin-id-123",
      "updated_by": "admin-id-456",
      "created_at": "2024-01-15T11:00:00.000Z",
      "updated_at": "2024-01-15T11:30:00.000Z"
    }
  }
}
```

#### Bad Scenario Responses

**404 Not Found**
```json
{
  "success": false,
  "message": "Book not found"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Token has expired"
}
```

---

### 8. Delete Book
**DELETE** `/books/{id}`

Delete a book (requires authentication - Admin/Librarian only).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `id`: Book UUID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Book deleted successfully"
}
```

#### Bad Scenario Responses

**400 Bad Request - Active Reservations**
```json
{
  "success": false,
  "message": "Cannot delete book with active reservations"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Book not found"
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Token is invalid"
}
```

---

## Internal Service Endpoints

These endpoints are for service-to-service communication and require the `X-Service-Token` header.

### 9. Reserve Book (Internal)
**POST** `/internal/books/{id}/reserve`

Reserve books for a user (called by Reservation Service).

#### Headers
```
X-Service-Token: <service_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "quantity": 1
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Book reserved successfully",
  "data": {
    "book": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "The Great Gatsby",
      "available_quantity": 2
    },
    "reserved_quantity": 1
  }
}
```

#### Bad Scenario Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Insufficient books available"
}
```

---

### 10. Return Book (Internal)
**POST** `/internal/books/{id}/return`

Return books from a user (called by Reservation Service).

#### Headers
```
X-Service-Token: <service_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "quantity": 1
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Book returned successfully",
  "data": {
    "book": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "The Great Gatsby",
      "available_quantity": 4
    },
    "returned_quantity": 1
  }
}
```

---

## Event Publishing

The Book Service publishes events to RabbitMQ for other services to consume.

### Published Events

#### book.created
```json
{
  "eventType": "book.created",
  "timestamp": "2024-01-15T11:00:00.000Z",
  "source": "book-service",
  "data": {
    "bookId": "660e8400-e29b-41d4-a716-446655440001",
    "title": "To Kill a Mockingbird",
    "author": "Harper Lee",
    "isbn": "9780061120084",
    "quantity": 3,
    "createdBy": "admin-id-123"
  }
}
```

#### book.updated
```json
{
  "eventType": "book.updated",
  "timestamp": "2024-01-15T11:30:00.000Z",
  "source": "book-service",
  "data": {
    "bookId": "660e8400-e29b-41d4-a716-446655440001",
    "title": "To Kill a Mockingbird (Updated)",
    "author": "Harper Lee",
    "isbn": "9780061120084",
    "quantity": 5,
    "updatedBy": "admin-id-456"
  }
}
```

#### book.deleted
```json
{
  "eventType": "book.deleted",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "source": "book-service",
  "data": {
    "bookId": "660e8400-e29b-41d4-a716-446655440001",
    "deletedBy": "admin-id-123"
  }
}
```

---

## Error Codes

| Status Code | Description | Common Causes |
|-------------|-------------|---------------|
| 400 | Bad Request | Invalid request data, validation errors |
| 401 | Unauthorized | Missing/invalid token, expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Book not found |
| 409 | Conflict | Duplicate ISBN, constraint violations |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limiting exceeded |
| 500 | Internal Server Error | Database errors, service failures |

---

## Testing Examples

### Using cURL

#### Get all books
```bash
curl -X GET http://localhost:8000/api/v1/books
```

#### Search books
```bash
curl -X GET "http://localhost:8000/api/v1/books/search?q=gatsby&type=title"
```

#### Create a book (requires admin token)
```bash
curl -X POST http://localhost:8000/api/v1/books \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "title": "1984",
    "author": "George Orwell",
    "isbn": "9780451524935",
    "description": "A dystopian social science fiction novel",
    "quantity": 4
  }'
```

#### Update a book
```bash
curl -X PUT http://localhost:8000/api/v1/books/BOOK_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "title": "1984 (Updated)",
    "author": "George Orwell",
    "isbn": "9780451524935",
    "description": "A dystopian social science fiction novel - Updated",
    "quantity": 6
  }'
```

#### Reserve book (internal service call)
```bash
curl -X POST http://localhost:8000/api/v1/internal/books/BOOK_ID/reserve \
  -H "Content-Type: application/json" \
  -H "X-Service-Token: internal-service-token" \
  -d '{"quantity": 1}'
```

---

## Security Considerations

1. **JWT Token Validation**: All protected endpoints validate JWT tokens
2. **Service Token Authentication**: Internal endpoints require service tokens
3. **Input Validation**: All inputs are validated and sanitized
4. **SQL Injection Protection**: Using Laravel's Eloquent ORM
5. **CORS Configuration**: Properly configured for allowed origins
6. **Rate Limiting**: Implemented to prevent abuse
7. **Error Handling**: Secure error messages without sensitive information

---

## Monitoring and Logging

- **Health Checks**: Available at `/api/v1/health`
- **Request Logging**: All API requests are logged
- **Error Logging**: Detailed error logs for debugging
- **Performance Metrics**: Response times and memory usage tracking
- **Event Publishing**: All book operations publish events for audit trails

---

## Database Schema

### Books Table
```sql
CREATE TABLE books (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(13) UNIQUE,
    description TEXT,
    quantity INT DEFAULT 1,
    available_quantity INT DEFAULT 1,
    created_by CHAR(36),
    updated_by CHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Indexes
- Primary key on `id`
- Unique index on `isbn`
- Index on `title` for search performance
- Index on `author` for search performance
- Index on `available_quantity` for availability queries 