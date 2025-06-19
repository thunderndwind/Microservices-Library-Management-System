# Reservation Service

The Reservation Service is a Ruby on Rails API service that handles book borrowing, returns, and reservation management for the Library Management System. It manages the complete lifecycle of book reservations from creation to return.

## Features

- **Book Reservations**: Create and manage book reservations
- **Return Management**: Handle book returns and update availability
- **Due Date Extensions**: Allow users to extend reservation periods
- **Overdue Tracking**: Automatically track and manage overdue books
- **User Limits**: Enforce maximum books per user policies
- **Event Publishing**: Publish reservation events to RabbitMQ
- **Health Monitoring**: Comprehensive health checks and metrics
- **Rate Limiting**: Protect against abuse with configurable limits

## Technology Stack

- **Framework**: Ruby on Rails 8.0 (API mode)
- **Language**: Ruby 3.3.8
- **Database**: SQLite3 (development) / PostgreSQL (production)
- **Authentication**: JWT tokens
- **Message Queue**: RabbitMQ (via Bunny gem)
- **HTTP Client**: HTTParty
- **Rate Limiting**: Rack::Attack
- **Pagination**: Kaminari

## Architecture

### Service Communication
The Reservation Service communicates with:
- **User Service** (Port 3001): Validate user existence
- **Book Service** (Port 8000): Check availability and manage inventory
- **RabbitMQ**: Publish reservation events

### Database Schema
```sql
reservations:
  - id (UUID, Primary Key)
  - user_id (UUID, Foreign Key)
  - book_id (UUID, Foreign Key)
  - reserved_at (DateTime)
  - due_date (DateTime)
  - returned_at (DateTime, nullable)
  - status (String: active, returned, overdue)
  - created_at, updated_at (DateTime)
```

## Business Rules

- **Maximum Books per User**: 5 active reservations
- **Maximum Reservation Period**: 14 days
- **Automatic Overdue Detection**: Books become overdue after due date
- **Extension Limits**: Due dates cannot exceed 14 days from reservation
- **Return Processing**: Updates book availability in Book Service

## Installation & Setup

### Prerequisites
- Ruby 3.3.8
- Rails 8.0
- SQLite3 (development) or PostgreSQL (production)
- RabbitMQ server

### Local Development Setup

1. **Clone and Navigate**
   ```bash
   cd services/reservation-service
   ```

2. **Install Dependencies**
   ```bash
   bundle install
   ```

3. **Setup Database**
   ```bash
   rails db:create db:migrate
   ```

4. **Environment Configuration**
   Create `.env` file with:
   ```env
   PORT=3000
   RAILS_ENV=development
   DATABASE_URL=sqlite3:storage/development.sqlite3
   JWT_SECRET=your_jwt_secret_key_change_in_production
   RABBITMQ_URL=amqp://localhost:5672
   RABBITMQ_EXCHANGE=library_events
   USER_SERVICE_URL=http://localhost:3001
   BOOK_SERVICE_URL=http://localhost:8000
   SERVICE_TOKEN=internal-service-token-change-in-production
   CORS_ORIGINS=http://localhost:3002,http://localhost:3004
   RATE_LIMIT_REQUESTS=100
   RATE_LIMIT_PERIOD=900
   MAX_BOOKS_PER_USER=5
   MAX_RESERVATION_DAYS=14
   ```

5. **Start the Service**
   ```bash
   rails server -p 3000
   ```

6. **Verify Installation**
   ```bash
   curl http://localhost:3000/health
   ```

## API Endpoints

### Core Endpoints
- `POST /api/v1/reservations` - Create reservation
- `GET /api/v1/reservations` - List reservations (with filtering)
- `GET /api/v1/reservations/{id}` - Get reservation details
- `PUT /api/v1/reservations/{id}/return` - Return book
- `PUT /api/v1/reservations/{id}/extend` - Extend due date
- `GET /api/v1/reservations/user/{userId}` - Get user reservations
- `GET /api/v1/reservations/overdue` - Get overdue reservations

### Health Check
- `GET /health` - Service health status
- `GET /api/v1/reservations/health` - Detailed health metrics

## Authentication

### JWT Authentication
Most endpoints require JWT authentication:
```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/v1/reservations
```

### Service Token Authentication
Internal service calls use service tokens:
```bash
curl -H "X-Service-Token: <service-token>" http://localhost:3000/api/v1/internal/...
```

## Event Publishing

The service publishes events to RabbitMQ:

### Events Published
- `reservation.created` - New reservation created
- `reservation.returned` - Book returned
- `reservation.overdue` - Reservation became overdue
- `reservation.extended` - Due date extended

### Event Format
```json
{
  "eventType": "reservation.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "reservation-service",
  "data": {
    "reservationId": "uuid",
    "userId": "uuid",
    "bookId": "uuid",
    "dueDate": "2024-01-29T23:59:59.000Z",
    "status": "active"
  }
}
```

## Rate Limiting

Configured rate limits:
- **General API**: 100 requests per 15 minutes per IP
- **Reservation Creation**: 20 requests per 15 minutes per IP
- **Invalid Token Attempts**: 5 requests per 15 minutes per IP

## Testing

### Manual Testing with cURL

**Create Reservation**
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

**Get Reservations**
```bash
curl -X GET "http://localhost:3000/api/v1/reservations?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Return Book**
```bash
curl -X PUT http://localhost:3000/api/v1/reservations/RESERVATION_ID/return \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Running Tests
```bash
# Run all tests
bundle exec rspec

# Run specific test file
bundle exec rspec spec/models/reservation_spec.rb

# Run with coverage
bundle exec rspec --format documentation
```

## Docker Deployment

### Build Image
```bash
docker build -t reservation-service .
```

### Run Container
```bash
docker run -p 3000:3000 --env-file .env reservation-service
```

### Docker Compose
```yaml
version: '3.8'
services:
  reservation-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - RAILS_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/reservations
      - JWT_SECRET=your_secret
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - db
      - rabbitmq
```

## Monitoring & Health Checks

### Health Endpoint Response
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

### Metrics Tracked
- Total reservations count
- Active reservations count
- Overdue reservations count
- Service uptime
- Memory usage statistics

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Due date must be after reservation date"]
}
```

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Authorization token is required"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Reservation not found"
}
```

**429 Too Many Requests**
```json
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later."
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `RAILS_ENV` | Rails environment | development |
| `DATABASE_URL` | Database connection string | sqlite3:storage/development.sqlite3 |
| `JWT_SECRET` | JWT signing secret | - |
| `RABBITMQ_URL` | RabbitMQ connection string | amqp://localhost:5672 |
| `RABBITMQ_EXCHANGE` | RabbitMQ exchange name | library_events |
| `USER_SERVICE_URL` | User service URL | http://localhost:3001 |
| `BOOK_SERVICE_URL` | Book service URL | http://localhost:8000 |
| `SERVICE_TOKEN` | Internal service token | - |
| `CORS_ORIGINS` | Allowed CORS origins | http://localhost:3002,http://localhost:3004 |
| `RATE_LIMIT_REQUESTS` | Rate limit requests | 100 |
| `RATE_LIMIT_PERIOD` | Rate limit period (seconds) | 900 |
| `MAX_BOOKS_PER_USER` | Maximum books per user | 5 |
| `MAX_RESERVATION_DAYS` | Maximum reservation days | 14 |

## Security Considerations

1. **JWT Validation**: All protected endpoints validate JWT tokens
2. **Service Authentication**: Internal calls use service tokens
3. **Rate Limiting**: Prevents abuse and DoS attacks
4. **Input Validation**: Comprehensive request validation
5. **CORS Configuration**: Restricts cross-origin requests
6. **SQL Injection Prevention**: Uses Rails ORM and parameterized queries
7. **Error Information**: Limited error details in production

## Performance Considerations

1. **Database Indexing**: Optimized indexes for common queries
2. **Pagination**: All list endpoints support pagination
3. **Connection Pooling**: Database connection pooling configured
4. **Caching**: Rate limiting uses memory cache
5. **Async Processing**: Event publishing is non-blocking

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check database configuration
rails db:migrate:status

# Reset database
rails db:drop db:create db:migrate
```

**RabbitMQ Connection Issues**
```bash
# Check RabbitMQ status
sudo systemctl status rabbitmq-server

# Test connection
curl -u guest:guest http://localhost:15672/api/overview
```

**JWT Token Issues**
- Verify JWT_SECRET is set correctly
- Check token expiration
- Validate token format

**Service Communication Errors**
- Verify other services are running
- Check service URLs in environment
- Validate service tokens

### Logs
```bash
# View Rails logs
tail -f log/development.log

# View production logs
tail -f log/production.log

# Check for errors
grep ERROR log/development.log
```

## Contributing

1. **Code Style**: Follow Rails conventions and Rubocop rules
2. **Testing**: Add tests for new functionality
3. **Documentation**: Update API documentation for changes
4. **Error Handling**: Implement proper error handling
5. **Events**: Publish appropriate events for state changes

### Development Workflow
1. Create feature branch
2. Implement changes with tests
3. Update documentation
4. Submit pull request
5. Code review and merge

## License

This project is part of the Library Management System and follows the same licensing terms.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check service logs
4. Contact the development team

---

**Service Status**: ✅ Active  
**Last Updated**: 2024-01-15  
**Version**: 1.0.0
