# Book Service

The Book Service is a Laravel-based microservice that manages the book catalog for the Library Management System. It provides comprehensive book management functionality with search capabilities, availability tracking, and event-driven architecture.

## Features

- **Complete Book Management**: CRUD operations for books with validation
- **Advanced Search**: Search by title, author, ISBN, or all fields
- **Availability Tracking**: Real-time book availability and reservation management
- **JWT Authentication**: Secure API access with role-based permissions
- **Service-to-Service Communication**: Internal APIs for microservice integration
- **Event Publishing**: RabbitMQ integration for system-wide event notifications
- **Health Monitoring**: Comprehensive health checks and monitoring endpoints
- **Docker Support**: Containerized deployment with nginx and PHP-FPM

## Technology Stack

- **Framework**: Laravel 11 (PHP 8.3)
- **Database**: MySQL
- **Authentication**: JWT (tymon/jwt-auth)
- **Message Queue**: RabbitMQ
- **Web Server**: Nginx + PHP-FPM
- **Containerization**: Docker

## Quick Start

### Prerequisites

- PHP 8.3+
- Composer
- MySQL 8.0+
- RabbitMQ (optional, for event publishing)

### Installation

1. **Install dependencies**:
   ```bash
   composer install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   php artisan key:generate
   php artisan jwt:secret
   ```

3. **Configure database** in `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=library_books
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```

4. **Run migrations**:
   ```bash
   php artisan migrate
   ```

5. **Start the service**:
   ```bash
   php artisan serve --port=8000
   ```

### Docker Deployment

1. **Build the image**:
   ```bash
   docker build -t book-service .
   ```

2. **Run the container**:
   ```bash
   docker run -p 8000:8000 \
     -e DB_HOST=your_mysql_host \
     -e DB_DATABASE=library_books \
     -e DB_USERNAME=root \
     -e DB_PASSWORD=your_password \
     book-service
   ```

## API Endpoints

### Public Endpoints (No Authentication)
- `GET /api/v1/health` - Health check
- `GET /api/v1/books` - List all books with pagination
- `GET /api/v1/books/{id}` - Get book by ID
- `GET /api/v1/books/search` - Search books
- `GET /api/v1/books/{id}/availability` - Check book availability

### Protected Endpoints (Require JWT)
- `POST /api/v1/books` - Create new book
- `PUT /api/v1/books/{id}` - Update book
- `DELETE /api/v1/books/{id}` - Delete book

### Internal Endpoints (Service-to-Service)
- `POST /api/v1/internal/books/{id}/reserve` - Reserve books
- `POST /api/v1/internal/books/{id}/return` - Return books

## Authentication

The service supports two authentication methods:

1. **JWT Bearer Token**: For admin/librarian access
   ```bash
   Authorization: Bearer <jwt_token>
   ```

2. **Service Token**: For inter-service communication
   ```bash
   X-Service-Token: <service_token>
   ```

## Configuration

### Environment Variables

```env
# Application
APP_NAME="Book Service"
APP_ENV=local
APP_KEY=base64:your_app_key_here
APP_DEBUG=true
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=library_books
DB_USERNAME=root
DB_PASSWORD=

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_TTL=60
JWT_REFRESH_TTL=20160

# RabbitMQ
RABBITMQ_HOST=127.0.0.1
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_EXCHANGE=library_events

# Service Communication
SERVICE_TOKEN=internal-service-token-change-in-production
ADMIN_SERVICE_URL=http://localhost:3003
USER_SERVICE_URL=http://localhost:3001
```

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

## Event Publishing

The service publishes events to RabbitMQ for system-wide notifications:

- `book.created` - When a new book is added
- `book.updated` - When a book is modified
- `book.deleted` - When a book is removed

## Testing

### Manual Testing with cURL

1. **Health Check**:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

2. **List Books**:
   ```bash
   curl http://localhost:8000/api/v1/books
   ```

3. **Search Books**:
   ```bash
   curl "http://localhost:8000/api/v1/books/search?q=gatsby&type=title"
   ```

4. **Create Book** (requires admin JWT):
   ```bash
   curl -X POST http://localhost:8000/api/v1/books \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "title": "1984",
       "author": "George Orwell",
       "isbn": "9780451524935",
       "description": "A dystopian novel",
       "quantity": 5
     }'
   ```

### Unit Tests

Run the test suite:
```bash
php artisan test
```

## Monitoring

### Health Checks

The service provides comprehensive health monitoring:

```bash
curl http://localhost:8000/api/v1/health
```

Response includes:
- Service uptime
- Total books count
- Available books count
- Memory usage statistics

### Logging

Logs are available in:
- `storage/logs/laravel.log` - Application logs
- `/var/log/nginx/` - Nginx access/error logs (Docker)
- `/var/log/php-fpm.log` - PHP-FPM logs (Docker)

## Security

- **Input Validation**: All inputs are validated using Laravel Form Requests
- **SQL Injection Protection**: Using Eloquent ORM with parameterized queries
- **JWT Token Validation**: Secure token-based authentication
- **Service Token Authentication**: Internal API protection
- **CORS Configuration**: Properly configured cross-origin requests
- **Error Handling**: Secure error messages without sensitive data exposure

## Performance

- **Database Indexing**: Optimized indexes for search performance
- **Pagination**: Efficient pagination for large datasets
- **Caching**: Redis caching for improved performance
- **Connection Pooling**: Optimized database connections

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Check MySQL service is running
   - Verify database credentials in `.env`
   - Ensure database exists

2. **JWT Token Issues**:
   - Run `php artisan jwt:secret` to generate JWT secret
   - Check JWT configuration in `config/jwt.php`

3. **RabbitMQ Connection Error**:
   - Verify RabbitMQ is running
   - Check RabbitMQ credentials in `.env`
   - Service will work without RabbitMQ (events won't be published)

4. **Permission Errors**:
   - Ensure storage directory is writable
   - Check file permissions: `chmod -R 755 storage bootstrap/cache`

### Debug Mode

Enable debug mode for detailed error messages:
```env
APP_DEBUG=true
LOG_LEVEL=debug
```

## Contributing

1. Follow PSR-12 coding standards
2. Write tests for new features
3. Update documentation
4. Use meaningful commit messages

## API Documentation

For detailed API documentation with request/response examples, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## License

This project is part of the Library Management System microservices architecture.
