# Local Development Guide - Running Services Individually

This guide helps you run each microservice individually for development, ensuring all prerequisites are available.

## 🗄️ Prerequisites - Start Dependencies First

### 1. Start Infrastructure Services (Docker)

First, start only the infrastructure services (databases, message broker) using alternative ports to avoid conflicts:

```bash
# Start infrastructure services with alternative ports
./start-infrastructure.sh

# Or manually:
docker compose -f docker-compose.infrastructure-alt.yml up -d

# Verify services are running
docker compose -f docker-compose.infrastructure-alt.yml ps
```

**Services Started (Alternative Ports):**

-   **MongoDB** (Port 27018) - For User & Admin services
-   **MySQL** (Port 3307) - For Book service
-   **PostgreSQL** (Port 5433) - For Reservation service
-   **Redis** (Port 6380) - For Notification service
-   **RabbitMQ** (Port 5673, Management 15673) - For all services

### 2. Verify Infrastructure Health

```bash
# Test MongoDB
docker exec library-mongodb-dev mongosh --eval "db.adminCommand('ping')"

# Test MySQL
docker exec library-mysql-dev mysql -u library_user -plibrary_password -e "SELECT 1;"

# Test PostgreSQL
docker exec library-postgresql-dev psql -U library_user -d library_reservations -c "SELECT 1;"

# Test Redis
docker exec library-redis-dev redis-cli ping

# Test RabbitMQ (should return running queues)
curl -u guest:guest http://localhost:15673/api/queues
```

---

## 🚀 Service Startup Order

**Recommended Order** (due to inter-service dependencies):

1. User Service (base dependency)
2. Admin Service (depends on User Service)
3. Book Service (independent)
4. Reservation Service (depends on Book & User services)
5. Notification Service (listens to all events)

---

## 1️⃣ User Service (Node.js - Port 3001)

**Dependencies**: MongoDB (Port 27018), RabbitMQ (Port 5673)

### Setup & Run

```bash
cd services/user-service

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (Alternative Port)
MONGODB_URI=mongodb://admin:password123@localhost:27018/library_users?authSource=admin

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_for_users_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_for_users_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# RabbitMQ Configuration (Alternative Port)
RABBITMQ_URL=amqp://guest:guest@localhost:5673
RABBITMQ_EXCHANGE=library_events

# CORS Configuration
CORS_ORIGIN=http://localhost:3002
EOF

# Start the service
npm run dev
```

### Verify User Service

```bash
# Health check
curl http://localhost:3001/health

# Test registration
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestUser123!",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'
```

---

## 2️⃣ Admin Service (Node.js - Port 3003)

**Dependencies**: MongoDB (Port 27018), RabbitMQ (Port 5673), User Service

### Setup & Run

```bash
cd services/admin-service

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
# Server Configuration
PORT=3003
NODE_ENV=development

# Database Configuration (Alternative Port)
MONGODB_URI=mongodb://admin:password123@localhost:27018/library_admins?authSource=admin

# JWT Configuration (Enhanced security)
JWT_SECRET=your_super_secret_jwt_key_for_admins_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_for_admins_change_in_production
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=24h

# RabbitMQ Configuration (Alternative Port)
RABBITMQ_URL=amqp://guest:guest@localhost:5673
RABBITMQ_EXCHANGE=library_events

# CORS Configuration
CORS_ORIGIN=http://localhost:3004

# Service Communication
USER_SERVICE_URL=http://localhost:3001
SERVICE_TOKEN=internal-service-token-change-in-production

# Super Admin Configuration
SUPER_ADMIN_EMAIL=superadmin@library.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin
EOF

# Create Super Admin (one-time setup)
npm run create-super-admin

# Start the service
npm run dev
```

### Verify Admin Service

```bash
# Health check
curl http://localhost:3003/health

# Test super admin login
curl -X POST http://localhost:3003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@library.com",
    "password": "SuperAdmin123!"
  }'
```

---

## 3️⃣ Book Service (Laravel - Port 8000)

**Dependencies**: MySQL (Port 3307), RabbitMQ (Port 5673)

### Setup & Run

```bash
cd services/book-service

# Install PHP dependencies
composer install

# Create environment file
cat > .env << EOF
APP_NAME="Library Book Service"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

# Database Configuration (Alternative Port)
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3307
DB_DATABASE=library_books
DB_USERNAME=library_user
DB_PASSWORD=library_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_change_in_production

# RabbitMQ Configuration (Alternative Port)
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5673
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_EXCHANGE=library_events

# Service Token
SERVICE_TOKEN=internal-service-token-change-in-production

# Cache Configuration
CACHE_DRIVER=file
SESSION_DRIVER=file
EOF

# Generate application key
php artisan key:generate

# Generate JWT secret
php artisan jwt:secret

# Run database migrations
php artisan migrate

# Start the service
php artisan serve --port=8000
```

### Verify Book Service

```bash
# Health check
curl http://localhost:8000/api/v1/health

# Test book listing (public endpoint)
curl http://localhost:8000/api/v1/books
```

---

## 4️⃣ Reservation Service (Ruby on Rails - Port 3000)

**Dependencies**: PostgreSQL (Port 5433), RabbitMQ (Port 5673), Book Service, User Service

### Setup & Run

```bash
cd services/reservation-service

# Install Ruby dependencies
bundle install

# Setup database configuration
cat > config/database.yml << EOF
development:
  adapter: postgresql
  encoding: unicode
  database: library_reservations
  pool: 5
  username: library_user
  password: library_password
  host: localhost
  port: 5433

test:
  adapter: postgresql
  encoding: unicode
  database: library_reservations_test
  pool: 5
  username: library_user
  password: library_password
  host: localhost
  port: 5433

production:
  adapter: postgresql
  encoding: unicode
  database: library_reservations
  pool: 5
  username: library_user
  password: library_password
  host: localhost
  port: 5433
EOF

# Create environment configuration
cat > .env << EOF
RAILS_ENV=development
DATABASE_URL=postgresql://library_user:library_password@localhost:5433/library_reservations
RABBITMQ_URL=amqp://guest:guest@localhost:5673
JWT_SECRET=your_jwt_secret_here_change_in_production
BOOK_SERVICE_URL=http://localhost:8000
USER_SERVICE_URL=http://localhost:3001
SERVICE_TOKEN=internal-service-token-change-in-production
EOF

# Setup database
rails db:create
rails db:migrate

# Start the service
rails server -p 3000
```

### Verify Reservation Service

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Test reservations endpoint (requires auth)
curl http://localhost:3000/api/v1/reservations \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5️⃣ Notification Service (FastAPI - Port 8001)

**Dependencies**: Redis (Port 6380), RabbitMQ (Port 5673)

### Setup & Run

```bash
cd services/notification-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cat > .env << EOF
# Server Configuration
HOST=0.0.0.0
PORT=8001
ENVIRONMENT=development
DEBUG=true

# Database Configuration (Alternative Port)
REDIS_URL=redis://localhost:6380/0
REDIS_HOST=localhost
REDIS_PORT=6380
REDIS_DB=0

# RabbitMQ Configuration (Alternative Port)
RABBITMQ_URL=amqp://guest:guest@localhost:5673
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5673
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_EXCHANGE=library_events

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_ALGORITHM=HS256

# Email Configuration (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
EMAIL_FROM=noreply@library.com

# External Services
USER_SERVICE_URL=http://localhost:3001
ADMIN_SERVICE_URL=http://localhost:3003
BOOK_SERVICE_URL=http://localhost:8000
RESERVATION_SERVICE_URL=http://localhost:3000

# Service Token
SERVICE_TOKEN=internal-service-token-change-in-production

# CORS Origins
CORS_ORIGINS=["http://localhost:3002", "http://localhost:3004"]
EOF

# Start the service
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

### Verify Notification Service

```bash
# Health check
curl http://localhost:8001/health

# Test notification templates
curl http://localhost:8001/api/v1/notifications/templates
```

---

## 🧪 Testing All Services

### Quick Health Check Script

```bash
# Create a test script
cat > test-all-services.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing All Services..."
echo "=========================="

services=(
  "User Service:http://localhost:3001/health"
  "Admin Service:http://localhost:3003/health"
  "Book Service:http://localhost:8000/api/v1/health"
  "Reservation Service:http://localhost:3000/api/v1/health"
  "Notification Service:http://localhost:8001/health"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  url="${service##*:}"
  echo -n "Testing $name... "

  if curl -s "$url" > /dev/null 2>&1; then
    echo "✅ OK"
  else
    echo "❌ FAILED"
  fi
done

echo ""
echo "🌐 Service URLs:"
echo "- User Service: http://localhost:3001"
echo "- Admin Service: http://localhost:3003"
echo "- Book Service: http://localhost:8000"
echo "- Reservation Service: http://localhost:3000"
echo "- Notification Service: http://localhost:8001"
echo "- RabbitMQ Management: http://localhost:15673 (guest/guest)"
echo ""
echo "🗄️ Infrastructure (Alternative Ports):"
echo "- MongoDB: localhost:27018"
echo "- MySQL: localhost:3307"
echo "- PostgreSQL: localhost:5433"
echo "- Redis: localhost:6380"
echo "- RabbitMQ: localhost:5673"
EOF

chmod +x test-all-services.sh
./test-all-services.sh
```

---

## 🛠️ Development Workflow

### 1. Daily Startup (Quick)

```bash
# Start infrastructure (if not running)
./start-infrastructure.sh

# Start all services (run each in separate terminal)
cd services/user-service && npm run dev &
cd services/admin-service && npm run dev &
cd services/book-service && php artisan serve --port=8000 &
cd services/reservation-service && rails server -p 3000 &
cd services/notification-service && source venv/bin/activate && uvicorn app.main:app --port 8001 --reload &
```

### 2. Stop All Services

```bash
# Stop infrastructure
docker compose -f docker-compose.infrastructure-alt.yml down

# Kill all service processes
pkill -f "npm run dev"
pkill -f "php artisan serve"
pkill -f "rails server"
pkill -f "uvicorn"
```

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check if databases are accessible
docker compose -f docker-compose.infrastructure-alt.yml ps
docker compose -f docker-compose.infrastructure-alt.yml logs mongodb
docker compose -f docker-compose.infrastructure-alt.yml logs mysql
docker compose -f docker-compose.infrastructure-alt.yml logs postgresql
```

#### Port Conflicts

```bash
# Check what's using ports
netstat -tulpn | grep :3001
netstat -tulpn | grep :3003
netstat -tulpn | grep :8000
netstat -tulpn | grep :3000
netstat -tulpn | grep :8001

# Check infrastructure ports
netstat -tulpn | grep :27018
netstat -tulpn | grep :3307
netstat -tulpn | grep :5433
netstat -tulpn | grep :6380
netstat -tulpn | grep :5673
```

#### RabbitMQ Issues

```bash
# Check RabbitMQ status (note alternative port)
curl -u guest:guest http://localhost:15673/api/overview

# View exchanges
curl -u guest:guest http://localhost:15673/api/exchanges
```

### Service-Specific Logs

Each service logs to console when running in development mode. Watch for:

-   Database connection confirmations
-   RabbitMQ connection status
-   Port binding confirmations
-   Any error messages during startup

---

## 📝 Notes

-   **Alternative Ports**: Infrastructure uses alternative ports to avoid conflicts with existing local services
-   **Service Order**: Always start User Service before Admin Service
-   **Database Isolation**: Each service uses a separate database/collection
-   **Inter-Service Communication**: Admin and Reservation services call other services
-   **Event System**: All services publish/consume events via RabbitMQ
-   **Development Mode**: All services run with auto-reload enabled
-   **Security**: Default passwords are used - change in production

**Happy Development! 🚀**
