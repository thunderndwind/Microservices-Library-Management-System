# Reservation Service Setup Guide

## Environment Configuration

Create a `.env` file in the `services/reservation-service` directory with the following variables:

```env
# Rails Configuration
RAILS_ENV=development
RAILS_LOG_LEVEL=debug
SECRET_KEY_BASE=your_super_secret_key_base_change_in_production_minimum_128_characters_long_for_security_purposes_please_generate_new_one

# Server Configuration
PORT=3000
RAILS_SERVE_STATIC_FILES=true

# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://library_user:library_password@localhost:5432/library_reservations_development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=library_reservations_development
DB_NAME_TEST=library_reservations_test
DB_USERNAME=library_user
DB_PASSWORD=library_password
DB_POOL=5

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_for_reservations_change_in_production
JWT_EXPIRES_IN=24h

# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=library_events

# Service Communication URLs
USER_SERVICE_URL=http://localhost:3001
ADMIN_SERVICE_URL=http://localhost:3003
BOOK_SERVICE_URL=http://localhost:8000
NOTIFICATION_SERVICE_URL=http://localhost:8001

# Service Authentication
SERVICE_TOKEN=internal-service-token-change-in-production

# CORS Configuration
CORS_ORIGINS=http://localhost:3002,http://localhost:3004

# Rate Limiting Configuration
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_BURST=10

# Business Rules Configuration
MAX_BOOKS_PER_USER=5
DEFAULT_LOAN_PERIOD_DAYS=14
MAX_EXTENSION_DAYS=7
OVERDUE_GRACE_PERIOD_DAYS=3

# Redis Configuration (for caching and rate limiting)
REDIS_URL=redis://localhost:6379/0
REDIS_CACHE_TTL=3600

# Logging Configuration
LOG_LEVEL=debug
LOG_TO_STDOUT=true

# Email Configuration (for notifications)
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@library.com

# Application URLs
FRONTEND_URL=http://localhost:3002
ADMIN_FRONTEND_URL=http://localhost:3004

# Health Check Configuration
HEALTH_CHECK_TOKEN=health-check-token-change-in-production

# Performance Configuration
WEB_CONCURRENCY=2
MAX_THREADS=5

# Security Configuration
FORCE_SSL=false
ALLOWED_HOSTS=localhost,127.0.0.1

# Feature Flags
ENABLE_BOOK_EXTENSIONS=true
ENABLE_OVERDUE_NOTIFICATIONS=true
ENABLE_RESERVATION_REMINDERS=true

# Monitoring Configuration
ENABLE_METRICS=true
METRICS_PORT=9090
```

## Database Setup

### 1. Ensure PostgreSQL is running
The service expects PostgreSQL to be available at `localhost:5432` with the credentials specified in the environment variables.

### 2. Create the database user and databases
```sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create user
CREATE USER library_user WITH PASSWORD 'library_password';

-- Create databases
CREATE DATABASE library_reservations_development OWNER library_user;
CREATE DATABASE library_reservations_test OWNER library_user;
CREATE DATABASE library_reservations_production OWNER library_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE library_reservations_development TO library_user;
GRANT ALL PRIVILEGES ON DATABASE library_reservations_test TO library_user;
GRANT ALL PRIVILEGES ON DATABASE library_reservations_production TO library_user;

-- Exit
\q
```

### 3. Install dependencies and setup
```bash
cd services/reservation-service

# Install Ruby gems
bundle install

# Generate a new secret key base
rails secret

# Update your .env file with the generated secret key base

# Create and run database migrations
rails db:create
rails db:migrate

# Seed the database (if seed file exists)
rails db:seed
```

## Required Infrastructure Services

Make sure these services are running before starting the Reservation Service:

1. **PostgreSQL** (port 5432)
2. **RabbitMQ** (port 5672)
3. **Redis** (port 6379) - for caching and rate limiting
4. **User Service** (port 3001)
5. **Book Service** (port 8000)

## Starting the Service

```bash
# Development mode
rails server -p 3000

# Or using the environment variable
PORT=3000 rails server
```

## Environment Variables Explanation

### Core Rails Configuration
- `RAILS_ENV`: Rails environment (development/test/production)
- `SECRET_KEY_BASE`: Rails secret key for encryption (generate with `rails secret`)
- `PORT`: Server port (default: 3000)

### Database Configuration
- `DATABASE_URL`: Complete PostgreSQL connection string
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`: Individual database connection parameters

### Authentication & Security
- `JWT_SECRET`: Secret key for JWT token signing
- `SERVICE_TOKEN`: Token for inter-service communication
- `CORS_ORIGINS`: Allowed origins for CORS

### Business Logic
- `MAX_BOOKS_PER_USER`: Maximum books a user can reserve (default: 5)
- `DEFAULT_LOAN_PERIOD_DAYS`: Default loan period in days (default: 14)
- `MAX_EXTENSION_DAYS`: Maximum extension period (default: 7)

### External Services
- `USER_SERVICE_URL`, `BOOK_SERVICE_URL`, etc.: URLs for other microservices
- `RABBITMQ_URL`: RabbitMQ connection string
- `REDIS_URL`: Redis connection string

## Testing the Setup

1. **Health Check**:
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **Database Connection**:
   ```bash
   rails console
   # In Rails console:
   ActiveRecord::Base.connection.execute("SELECT 1")
   ```

3. **Service Dependencies**:
   Make sure all required services are accessible from the reservation service.

## Troubleshooting

### Common Issues

1. **Database Connection Error**:
   - Verify PostgreSQL is running
   - Check database credentials in .env file
   - Ensure database exists and user has proper permissions

2. **Missing Secret Key Base**:
   - Generate with `rails secret`
   - Add to .env file as `SECRET_KEY_BASE`

3. **Port Already in Use**:
   - Change PORT in .env file
   - Or kill the process using the port: `lsof -ti:3000 | xargs kill -9`

4. **RabbitMQ Connection Issues**:
   - Verify RabbitMQ is running: `sudo systemctl status rabbitmq-server`
   - Check connection URL in .env file

5. **Redis Connection Issues**:
   - Verify Redis is running: `redis-cli ping`
   - Check Redis URL in .env file

## Production Considerations

For production deployment:

1. **Generate secure secrets**:
   ```bash
   rails secret  # For SECRET_KEY_BASE
   openssl rand -hex 64  # For JWT_SECRET
   openssl rand -hex 32  # For SERVICE_TOKEN
   ```

2. **Use environment-specific database URLs**
3. **Enable SSL** (`FORCE_SSL=true`)
4. **Configure proper CORS origins**
5. **Set up proper logging and monitoring**
6. **Use secure SMTP configuration for email notifications** 