# Library Management System - Microservices Architecture

A comprehensive library management system built with microservices architecture, featuring user management, book catalog, reservation system, and notifications.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Service  │    │  Admin Service  │    │  Book Service   │    │Reservation Svc  │
│    (Node.js)    │    │    (Node.js)    │    │   (Laravel)     │    │  (Ruby Rails)   │
│     Port 3001   │    │    Port 3003    │    │    Port 8000    │    │    Port 3000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │                       │
         └───────────────────────┼───────────────────────┼───────────────────────┘
                                 │                       │
                         ┌─────────────────┐    ┌─────────────────┐
                         │Notification Svc │    │    RabbitMQ     │
                         │   (FastAPI)     │    │  Message Broker │
                         │    Port 8001    │    │    Port 5672    │
                         └─────────────────┘    └─────────────────┘
```

## 🚀 Services

| Service                  | Technology        | Port | Database   | Purpose                                     |
| ------------------------ | ----------------- | ---- | ---------- | ------------------------------------------- |
| **User Service**         | Node.js + Express | 3001 | MongoDB    | Member authentication & management          |
| **Admin Service**        | Node.js + Express | 3003 | MongoDB    | Admin/Librarian authentication & management |
| **Book Service**         | Laravel + PHP     | 8000 | MySQL      | Book catalog & inventory management         |
| **Reservation Service**  | Ruby on Rails     | 3000 | PostgreSQL | Borrowing & returns management              |
| **Notification Service** | FastAPI + Python  | 8001 | Redis      | Events & notifications                      |

## 📋 Prerequisites

### Required Software

-   **Docker** & **Docker Compose** (recommended)
-   **Git**

### For Local Development

-   **Node.js** 18+ (for User & Admin services)
-   **PHP** 8.3+ with Composer (for Book service)
-   **Ruby** 3.2+ (for Reservation service)
-   **Python** 3.12+ (for Notification service)

### Required Databases

-   **MongoDB** 7.0+
-   **MySQL** 8.0+
-   **PostgreSQL** 15+
-   **Redis** 7+
-   **RabbitMQ** 3.12+

## 🐳 Quick Start with Docker (Recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/library-management-system.git
cd library-management-system
```

### 2. Start All Services

```bash
# Start all services with dependencies
docker compose up -d

# View logs
docker compose logs -f

# Check service status
docker compose ps
```

### 3. Initialize the System

```bash
# Create Super Admin account
docker compose exec admin-service npm run create-super-admin

# Run database migrations
docker compose exec book-service php artisan migrate
docker compose exec reservation-service rails db:migrate
```

### 4. Access Services

-   **RabbitMQ Management**: http://localhost:15672 (admin/password123)
-   **User Service Health**: http://localhost:3001/health
-   **Admin Service Health**: http://localhost:3003/health
-   **Book Service Health**: http://localhost:8000/api/v1/health
-   **Reservation Service Health**: http://localhost:3000/api/v1/health
-   **Notification Service Health**: http://localhost:8001/health

## 🛠️ Local Development Setup

### 1. Start Dependencies Only

```bash
# Start only databases and message broker
docker compose up -d mongodb mysql postgresql redis rabbitmq
```

### 2. Setup Each Service

#### User Service (Port 3001)

```bash
cd services/user-service
npm install
cp .env.example .env
# Edit .env with your database settings
npm run dev
```

#### Admin Service (Port 3003)

```bash
cd services/admin-service
npm install
cp .env.example .env
# Edit .env with your database settings
npm run create-super-admin
npm run dev
```

#### Book Service (Port 8000)

```bash
cd services/book-service
composer install
cp .env.example .env
# Edit .env with your database settings
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan serve --port=8000
```

#### Reservation Service (Port 3000)

```bash
cd services/reservation-service
bundle install
# Setup database configuration
rails db:migrate
rails server -p 3000
```

#### Notification Service (Port 8001)

```bash
cd services/notification-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Setup environment variables
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## 🔗 API Endpoints

### User Service (Port 3001)

| Method | Endpoint                | Description           | Auth Required |
| ------ | ----------------------- | --------------------- | ------------- |
| POST   | `/api/v1/auth/register` | Register new member   | No            |
| POST   | `/api/v1/auth/login`    | Member login          | No            |
| GET    | `/api/v1/auth/profile`  | Get member profile    | Yes           |
| PUT    | `/api/v1/auth/profile`  | Update member profile | Yes           |
| POST   | `/api/v1/auth/refresh`  | Refresh JWT token     | No            |
| POST   | `/api/v1/auth/logout`   | Logout member         | Yes           |

### Admin Service (Port 3003)

| Method | Endpoint                   | Description             | Auth Required |
| ------ | -------------------------- | ----------------------- | ------------- |
| POST   | `/api/v1/auth/login`       | Admin/Librarian login   | No            |
| POST   | `/api/v1/auth/register`    | Create admin/librarian  | Yes (Admin+)  |
| GET    | `/api/v1/users`            | Get all library members | Yes           |
| PUT    | `/api/v1/users/:id/status` | Update member status    | Yes           |
| GET    | `/api/v1/admins`           | Get all admins          | Yes           |

### Book Service (Port 8000)

| Method | Endpoint                         | Description        | Auth Required |
| ------ | -------------------------------- | ------------------ | ------------- |
| GET    | `/api/v1/books`                  | Get all books      | No            |
| GET    | `/api/v1/books/:id`              | Get book by ID     | No            |
| POST   | `/api/v1/books`                  | Create new book    | Yes           |
| PUT    | `/api/v1/books/:id`              | Update book        | Yes           |
| DELETE | `/api/v1/books/:id`              | Delete book        | Yes           |
| GET    | `/api/v1/books/search`           | Search books       | No            |
| GET    | `/api/v1/books/:id/availability` | Check availability | No            |

### Reservation Service (Port 3000)

| Method | Endpoint                          | Description           | Auth Required |
| ------ | --------------------------------- | --------------------- | ------------- |
| POST   | `/api/v1/reservations`            | Create reservation    | Yes           |
| GET    | `/api/v1/reservations`            | Get all reservations  | Yes           |
| GET    | `/api/v1/reservations/:id`        | Get reservation by ID | Yes           |
| PUT    | `/api/v1/reservations/:id/return` | Return book           | Yes           |
| PUT    | `/api/v1/reservations/:id/extend` | Extend due date       | Yes           |

### Notification Service (Port 8001)

| Method | Endpoint                         | Description            | Auth Required |
| ------ | -------------------------------- | ---------------------- | ------------- |
| POST   | `/api/v1/notifications/send`     | Send notification      | Yes           |
| GET    | `/api/v1/notifications/user/:id` | Get user notifications | Yes           |
| PUT    | `/api/v1/notifications/:id/read` | Mark as read           | Yes           |

## 🔐 Authentication

### Default Credentials

#### Super Admin (First-time setup)

-   **Email**: `superadmin@library.com`
-   **Password**: `SuperAdmin123!`
-   **Role**: Super Admin

⚠️ **Important**: Change the default password after first login!

### JWT Tokens

-   **User Service**: 24-hour access tokens, 7-day refresh tokens
-   **Admin Service**: 8-hour access tokens, 24-hour refresh tokens

### Using APIs

```bash
# 1. Login to get token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Use token in subsequent requests
curl -X GET http://localhost:8000/api/v1/books \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Key Features

### User Management

-   Member registration and authentication
-   Admin/Librarian authentication with role-based access
-   Profile management

### Book Management

-   Complete CRUD operations for books
-   Advanced search by title, author, ISBN
-   Real-time availability tracking

### Reservation System

-   Book reservation and return
-   Due date management
-   Reservation history

### Notification System

-   Email notifications for reservations
-   Due date reminders
-   System alerts

### Event-Driven Architecture

-   RabbitMQ message broker
-   Event publishing between services
-   Loose coupling between microservices

## 🧪 Testing

### Health Checks

```bash
# Check all services
curl http://localhost:3001/health
curl http://localhost:3003/health
curl http://localhost:8000/api/v1/health
curl http://localhost:3000/api/v1/health
curl http://localhost:8001/health
```

### Sample API Tests

```bash
# Register a new user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890"
  }'

# Search books
curl "http://localhost:8000/api/v1/books/search?q=gatsby&type=title"
```

## 🐛 Troubleshooting

### Common Issues

#### Services Not Starting

```bash
# Check Docker containers
docker compose ps

# View logs
docker compose logs [service-name]

# Restart specific service
docker compose restart [service-name]
```

#### Database Connection Issues

```bash
# Check database containers
docker compose ps mongodb mysql postgresql redis

# Test database connections
docker compose exec mongodb mongosh
docker compose exec mysql mysql -u root -p
docker compose exec postgresql psql -U library_user -d library_reservations
```

#### RabbitMQ Issues

```bash
# Access RabbitMQ management
open http://localhost:15672

# Check RabbitMQ logs
docker compose logs rabbitmq
```

### Port Conflicts

If you have port conflicts, modify the ports in `docker-compose.yml`:

```yaml
services:
    user-service:
        ports:
            - "3001:3001" # Change to "3011:3001" if port 3001 is busy
```

## 📁 Project Structure

```
library-management-system/
├── services/
│   ├── user-service/          # Node.js user management
│   ├── admin-service/         # Node.js admin management
│   ├── book-service/          # Laravel book catalog
│   ├── reservation-service/   # Rails reservation system
│   └── notification-service/  # FastAPI notifications
├── docker-compose.yml         # Docker orchestration
├── .gitignore                # Git ignore rules
├── PRD.md                    # Product Requirements Document
└── README.md                 # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of a microservices learning exercise.

## 📞 Support

For support and questions:

-   Check service health endpoints
-   Review logs using `docker compose logs`
-   Verify database connections
-   Ensure RabbitMQ is running

---

**Happy Coding! 🚀**
