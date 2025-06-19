# Product Requirements Document (PRD)

## Microservices Library Management System

### 1. Project Overview

**Goal**: Build a simple, event-driven microservices library management system that allows users to browse books, make reservations, and manage returns.

**Target Users**: Library staff and library members

**Core Philosophy**: Start simple, design for scalability

### 2. System Architecture

#### 2.1 Microservices Overview

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
                                 │
                ┌────────────────┼────────────────┐
                │                                 │
        ┌─────────────────┐               ┌─────────────────┐
        │  User Frontend  │               │ Admin Frontend  │
        │   (React.js)    │               │   (React.js)    │
        │    Port 3002    │               │    Port 3004    │
        └─────────────────┘               └─────────────────┘
```

#### 2.2 Technology Stack Distribution

| Service              | Technology        | Purpose                                     | Database                    |
| -------------------- | ----------------- | ------------------------------------------- | --------------------------- |
| User Service         | Node.js + Express | Member Authentication & Management          | MongoDB (users collection)  |
| Admin Service        | Node.js + Express | Admin/Librarian Authentication & Management | MongoDB (admins collection) |
| Book Service         | Laravel + PHP     | Book CRUD, Inventory                        | MySQL                       |
| Reservation Service  | Ruby on Rails     | Borrowing, Returns                          | PostgreSQL                  |
| Notification Service | FastAPI + Python  | Events, Notifications                       | Redis                       |

#### 2.3 Frontend Applications

| Application    | Technology            | Purpose                                                      | Users                             | Port |
| -------------- | --------------------- | ------------------------------------------------------------ | --------------------------------- | ---- |
| User Frontend  | React.js + TypeScript | Public catalog + Member interface for browsing, reservations | Public visitors + Library Members | 3002 |
| Admin Frontend | React.js + TypeScript | Management interface for books, users, reports               | Admins, Librarians                | 3004 |

#### 2.4 User Frontend Features

**Public Features (No Authentication Required):**

-   Browse public book catalog
-   Search books by title, author, ISBN
-   View book details and availability
-   User registration form
-   Login form
-   About/Contact pages

**Member Features (Authentication Required):**

-   Personal dashboard
-   Reserve available books
-   View personal reservation history
-   Manage profile settings
-   Receive in-app notifications
-   Extend due dates (if allowed)

**Navigation Flow:**

```
Public User → Browse Catalog → Register/Login → Member Dashboard → Make Reservations
```

### 3. Core Features (MVP)

#### 3.1 User Management

-   User registration and authentication
-   Role-based access (Admin, Librarian, Member)
-   Profile management

#### 3.2 Book Management

-   Add/Edit/Delete books (Admin/Librarian only)
-   View book catalog
-   Search books by title, author, ISBN
-   Book availability status

#### 3.3 Reservation System

-   Reserve available books
-   View current reservations
-   Return books
-   Reservation history

#### 3.4 Notification System

-   Email notifications for reservations
-   Due date reminders
-   System alerts

### 4. Detailed API Specifications

#### 4.1 User Service (Node.js - Port 3001)

**Base URL**: `http://localhost:3001/api/v1`
**Purpose**: Handle library member authentication and profile management

| Method | Endpoint         | Description                  | Request Body                                    | Response                |
| ------ | ---------------- | ---------------------------- | ----------------------------------------------- | ----------------------- |
| POST   | `/auth/register` | Register new member          | `{email, password, firstName, lastName, phone}` | `{user, token}`         |
| POST   | `/auth/login`    | Member login                 | `{email, password}`                             | `{user, token}`         |
| GET    | `/auth/profile`  | Get member profile           | -                                               | `{user}`                |
| PUT    | `/auth/profile`  | Update member profile        | `{firstName, lastName, phone}`                  | `{user}`                |
| POST   | `/auth/refresh`  | Refresh JWT token            | `{refreshToken}`                                | `{token, refreshToken}` |
| POST   | `/auth/logout`   | Logout member                | -                                               | `{message}`             |
| GET    | `/members/:id`   | Get member by ID (self only) | -                                               | `{user}`                |

#### 4.2 Admin Service (Node.js - Port 3003)

**Base URL**: `http://localhost:3003/api/v1`
**Purpose**: Handle admin/librarian authentication and user management

| Method | Endpoint            | Description                  | Request Body                                   | Response                |
| ------ | ------------------- | ---------------------------- | ---------------------------------------------- | ----------------------- |
| POST   | `/auth/register`    | Register new admin/librarian | `{email, password, firstName, lastName, role}` | `{admin, token}`        |
| POST   | `/auth/login`       | Admin/Librarian login        | `{email, password}`                            | `{admin, token}`        |
| GET    | `/auth/profile`     | Get admin profile            | -                                              | `{admin}`               |
| PUT    | `/auth/profile`     | Update admin profile         | `{firstName, lastName, phone}`                 | `{admin}`               |
| POST   | `/auth/refresh`     | Refresh JWT token            | `{refreshToken}`                               | `{token, refreshToken}` |
| POST   | `/auth/logout`      | Logout admin                 | -                                              | `{message}`             |
| GET    | `/users`            | Get all library members      | Query: `?page=&limit=&search=`                 | `{users[], pagination}` |
| GET    | `/users/:id`        | Get member by ID             | -                                              | `{user}`                |
| PUT    | `/users/:id/status` | Update member status         | `{status: active/suspended}`                   | `{user}`                |
| DELETE | `/users/:id`        | Delete member account        | -                                              | `{message}`             |
| GET    | `/admins`           | Get all admins/librarians    | -                                              | `{admins[]}`            |
| PUT    | `/admins/:id/role`  | Update admin role            | `{role: admin/librarian}`                      | `{admin}`               |

#### 4.3 Book Service (Laravel - Port 8000)

**Base URL**: `http://localhost:8000/api/v1`

| Method | Endpoint                  | Description        | Request Body                                   | Response                          |
| ------ | ------------------------- | ------------------ | ---------------------------------------------- | --------------------------------- |
| GET    | `/books`                  | Get all books      | Query: `?search=&page=&limit=`                 | `{books[], pagination}`           |
| GET    | `/books/:id`              | Get book by ID     | -                                              | `{book}`                          |
| POST   | `/books`                  | Add new book       | `{title, author, isbn, description, quantity}` | `{book}`                          |
| PUT    | `/books/:id`              | Update book        | `{title, author, description, quantity}`       | `{book}`                          |
| DELETE | `/books/:id`              | Delete book        | -                                              | `{message}`                       |
| GET    | `/books/search`           | Search books       | Query: `?q=&type=title/author/isbn`            | `{books[]}`                       |
| GET    | `/books/:id/availability` | Check availability | -                                              | `{available, quantity, reserved}` |

#### 4.4 Reservation Service (Ruby on Rails - Port 3000)

**Base URL**: `http://localhost:3000/api/v1`

| Method | Endpoint                     | Description           | Request Body                | Response           |
| ------ | ---------------------------- | --------------------- | --------------------------- | ------------------ |
| POST   | `/reservations`              | Create reservation    | `{userId, bookId, dueDate}` | `{reservation}`    |
| GET    | `/reservations`              | Get all reservations  | Query: `?userId=&status=`   | `{reservations[]}` |
| GET    | `/reservations/:id`          | Get reservation by ID | -                           | `{reservation}`    |
| PUT    | `/reservations/:id/return`   | Return book           | -                           | `{reservation}`    |
| PUT    | `/reservations/:id/extend`   | Extend due date       | `{newDueDate}`              | `{reservation}`    |
| GET    | `/reservations/user/:userId` | User's reservations   | -                           | `{reservations[]}` |
| GET    | `/reservations/overdue`      | Get overdue items     | -                           | `{reservations[]}` |

#### 4.5 Notification Service (FastAPI - Port 8001)

**Base URL**: `http://localhost:8001/api/v1`

| Method | Endpoint                      | Description                | Request Body                       | Response            |
| ------ | ----------------------------- | -------------------------- | ---------------------------------- | ------------------- |
| POST   | `/notifications/send`         | Send notification          | `{type, recipient, message, data}` | `{status}`          |
| GET    | `/notifications/user/:userId` | Get user notifications     | -                                  | `{notifications[]}` |
| PUT    | `/notifications/:id/read`     | Mark as read               | -                                  | `{notification}`    |
| GET    | `/notifications/templates`    | Get notification templates | -                                  | `{templates[]}`     |

### 5. Event-Driven Architecture (RabbitMQ)

#### 5.1 Events and Queues

| Event                  | Publisher            | Consumer                                  | Queue Name            | Payload                                       |
| ---------------------- | -------------------- | ----------------------------------------- | --------------------- | --------------------------------------------- |
| `user.registered`      | User Service         | Notification Service                      | `user_events`         | `{userId, email, firstName, type: 'member'}`  |
| `admin.registered`     | Admin Service        | Notification Service                      | `admin_events`        | `{adminId, email, firstName, role}`           |
| `book.created`         | Book Service         | Notification Service                      | `book_events`         | `{bookId, title, author, createdBy}`          |
| `book.updated`         | Book Service         | Notification Service                      | `book_events`         | `{bookId, title, author, updatedBy}`          |
| `reservation.created`  | Reservation Service  | Book Service, Notification Service        | `reservation_events`  | `{reservationId, userId, bookId, dueDate}`    |
| `reservation.returned` | Reservation Service  | Book Service, Notification Service        | `reservation_events`  | `{reservationId, userId, bookId, returnDate}` |
| `user.suspended`       | Admin Service        | Reservation Service, Notification Service | `user_events`         | `{userId, suspendedBy, reason}`               |
| `book.due_soon`        | Notification Service | -                                         | `notification_events` | `{userId, bookId, dueDate}`                   |

#### 5.2 Message Structure

```json
{
    "eventType": "reservation.created",
    "timestamp": "2024-01-15T10:30:00Z",
    "source": "reservation-service",
    "data": {
        "reservationId": "uuid",
        "userId": "uuid",
        "bookId": "uuid",
        "dueDate": "2024-01-29T23:59:59Z"
    }
}
```

### 6. Database Schemas

#### 6.1 User Service (MongoDB)

```javascript
// users collection (Library Members)
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String,
  status: String (active|suspended|inactive), // default: active
  membershipDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6.2 Admin Service (MongoDB)

```javascript
// admins collection (Admin/Librarian)
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phone: String,
  role: String (admin|librarian), // admin has full access, librarian has limited access
  permissions: Array, // specific permissions array
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 6.3 Book Service (MySQL)

```sql
-- books table
CREATE TABLE books (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255) NOT NULL,
  isbn VARCHAR(13) UNIQUE,
  description TEXT,
  quantity INT DEFAULT 1,
  available_quantity INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 6.4 Reservation Service (PostgreSQL)

```sql
-- reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  book_id UUID NOT NULL,
  reserved_at TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP NOT NULL,
  returned_at TIMESTAMP NULL,
  status VARCHAR(20) DEFAULT 'active', -- active, returned, overdue
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 6.5 Notification Service (Redis)

```json
// notifications:userId key
{
    "id": "uuid",
    "type": "reservation_due",
    "message": "Your book 'Title' is due tomorrow",
    "read": false,
    "createdAt": "timestamp",
    "data": { "bookId": "uuid", "dueDate": "date" }
}
```

### 7. Docker Configuration

#### 7.1 Services Overview

-   Each microservice will have its own Dockerfile
-   Docker Compose for orchestration
-   Separate containers for databases
-   RabbitMQ container
-   React frontend container

#### 7.2 Port Mapping

-   User Service: 3001
-   Admin Service: 3003
-   Book Service: 8000
-   Reservation Service: 3000
-   Notification Service: 8001
-   User Frontend: 3002
-   Admin Frontend: 3004
-   RabbitMQ: 5672, 15672 (management)
-   MongoDB: 27017
-   MySQL: 3306
-   PostgreSQL: 5432
-   Redis: 6379

### 8. Authentication & Security

#### 8.1 Separation of User Types - Security Benefits

**Why Separate User and Admin Services:**

-   **Security Isolation**: Admin credentials and member credentials are stored in completely separate collections/databases
-   **Different Authentication Flows**: Admins can have additional security layers (2FA, IP restrictions, etc.)
-   **Principle of Least Privilege**: Members never have access to admin endpoints, even by mistake
-   **Audit Trail**: Separate logging and monitoring for admin vs member actions
-   **Token Separation**: Different JWT secrets and expiration policies for different user types
-   **Database Isolation**: Can use different MongoDB databases or even different database servers

**Frontend Separation Benefits:**

-   **Attack Surface Reduction**: Admin features are not exposed in member frontend code
-   **Role-Specific UX**: Completely different interfaces optimized for different user needs
-   **Independent Deployment**: Can update admin features without affecting member experience
-   **Performance Optimization**: Each frontend can be optimized for its specific use case
-   **Security Headers**: Different security policies for different user types

#### 8.2 JWT Authentication

**User Service (Members):**

-   Issues JWT tokens for library members
-   Token expiration: 24 hours
-   Refresh token: 7 days
-   Secret key: `USER_JWT_SECRET`

**Admin Service (Admins/Librarians):**

-   Issues JWT tokens for admin/librarian users
-   Token expiration: 8 hours (shorter for security)
-   Refresh token: 24 hours
-   Secret key: `ADMIN_JWT_SECRET`
-   Additional security: IP whitelisting, 2FA (future enhancement)

**Token Validation:**

-   Each service validates its own tokens
-   Cross-service communication uses service-to-service tokens
-   Middleware validates token type matches the service

#### 8.3 Role-Based Access Control

**Member Role (User Service):**

-   Browse book catalog
-   Create/view own reservations
-   Update own profile
-   Receive notifications

**Librarian Role (Admin Service):**

-   All member permissions
-   Add/edit/delete books
-   View all reservations
-   Manage member accounts (suspend/activate)
-   Generate basic reports

**Admin Role (Admin Service):**

-   All librarian permissions
-   Create/manage other admin accounts
-   System configuration
-   Advanced analytics and reports
-   Bulk operations

### 9. Future Enhancements

#### 9.1 Phase 2 Features

-   Book recommendations
-   Fine management
-   Advanced search with filters
-   Book reviews and ratings
-   Waiting list for popular books

#### 9.2 Technical Improvements

-   API Gateway (Kong/Zuul)
-   Service discovery (Consul)
-   Monitoring (Prometheus + Grafana)
-   Centralized logging (ELK Stack)
-   CQRS pattern implementation
-   GraphQL Federation

### 11. Success Metrics

-   **Functional**: All core features working end-to-end
-   **Performance**: API response time < 200ms
-   **Reliability**: 99% uptime
-   **Scalability**: Easy to add new microservices
-   **Maintainability**: Clean, documented code

This PRD provides a solid foundation for building a scalable, maintainable library management system using microservices architecture.
