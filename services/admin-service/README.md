# Admin Service

The Admin Service handles admin and librarian authentication and management for the Library Management System with a hierarchical role-based access control system.

## Features

- **Three-tier role hierarchy**: Super Admin → Admin → Librarian
- **Secure account creation**: No public registration, role-based account creation
- **Enhanced security**: Stronger password requirements and shorter token expiration
- **Permission-based access control**: Granular permissions for different operations
- **Inter-service communication**: Manages library members via User Service API
- **Event publishing**: RabbitMQ integration for system events
- **Comprehensive API documentation**: Detailed documentation with examples

## Role Hierarchy

### Super Admin
- **Highest privilege level**
- Can create and manage all account types (Super Admin, Admin, Librarian)
- Full system access including system configuration
- Cannot be demoted if they are the last Super Admin

### Admin
- **Middle privilege level**
- Can only create and manage Librarian accounts
- Cannot create or manage other Admin or Super Admin accounts
- Has access to most system features except super admin functions

### Librarian
- **Basic privilege level**
- Cannot create any accounts
- Can manage books, users, and reservations
- Cannot access admin management or system configuration

## Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Message Queue**: RabbitMQ (amqplib)
- **Security**: helmet, cors, express-rate-limit

## Initial Setup

### 1. Install Dependencies
```bash
cd services/admin-service
npm install
```

### 2. Environment Configuration
Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3003
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/library_admins

# JWT Configuration (Enhanced security with shorter expiration)
JWT_SECRET=your_super_secret_jwt_key_for_admins_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_for_admins_change_in_production
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=24h

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=library_events

# CORS Configuration
CORS_ORIGIN=http://localhost:3004

# Service Communication
USER_SERVICE_URL=http://localhost:3001
SERVICE_TOKEN=internal-service-token-change-in-production

# Super Admin Configuration (for initial setup)
SUPER_ADMIN_EMAIL=superadmin@library.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin
SUPER_ADMIN_PHONE=+1234567890
```

### 3. Create the First Super Admin
⚠️ **Important**: Since public registration is disabled, you must create the first Super Admin account:

```bash
# Using npm script
npm run create-super-admin

# Or directly
node create-super-admin.js
```

**Default credentials** (if no environment variables set):
- Email: `superadmin@library.com`
- Password: `SuperAdmin123!`
- Role: `super_admin`

⚠️ **Security**: Change the default password immediately after first login!

### 4. Start the Service
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## Account Creation Workflow

### Initial Setup
1. Run the super admin creation script (one-time only)
2. Login as Super Admin
3. Create Admin accounts as needed
4. Admins can then create Librarian accounts

### Role-Based Account Creation
- **Super Admin** → Can create: Super Admin, Admin, Librarian
- **Admin** → Can create: Librarian only
- **Librarian** → Cannot create any accounts

## API Endpoints

### Authentication Routes (`/api/v1/auth`)
- `POST /login` - Login (public)
- `POST /register` - Create account (requires authentication)
- `GET /profile` - Get profile (requires authentication)
- `PUT /profile` - Update profile (requires authentication)
- `POST /refresh` - Refresh token (public)
- `POST /logout` - Logout (requires authentication)

### User Management Routes (`/api/v1/users`)
- `GET /` - Get all library members
- `GET /:id` - Get member by ID
- `PUT /:id/status` - Update member status
- `DELETE /:id` - Delete member (Super Admin only)

### Admin Management Routes (`/api/v1/admins`)
- `GET /` - Get all admins/librarians
- `PUT /:id/role` - Update admin role
- `GET /health` - Health check

## Security Features

### Enhanced Password Requirements
- Minimum 8 characters
- Must contain uppercase, lowercase, number, and special character
- Stronger than User Service requirements

### JWT Token Security
- **Access tokens**: 8 hours (shorter than User Service)
- **Refresh tokens**: 24 hours (shorter than User Service)
- Separate JWT secrets from User Service

### Rate Limiting
- **Authentication endpoints**: 3 requests per 15 minutes
- **General endpoints**: 50 requests per 15 minutes
- Stricter than User Service limits

### Role-Based Access Control
- Granular permissions system
- Hierarchical role structure
- Permission validation on every request

## Events Published

The service publishes the following events to RabbitMQ:

- `admin.registered` - When a new admin/librarian is created
- `admin.login` - When an admin/librarian logs in
- `user.suspended` - When an admin suspends a user

## Docker Support

### Build Image
```bash
docker build -t admin-service .
```

### Run Container
```bash
docker run -p 3003:3003 --env-file .env admin-service
```

## Development

### Project Structure
```
src/
├── config/          # Configuration files
│   ├── database.js  # MongoDB connection
│   └── jwt.js       # JWT configuration
├── controllers/     # Route controllers
│   ├── authController.js
│   ├── userController.js
│   └── adminController.js
├── middleware/      # Custom middleware
│   ├── auth.js      # Authentication & authorization
│   └── validation.js # Input validation
├── models/          # Mongoose models
│   └── Admin.js     # Admin model with role hierarchy
├── routes/          # Express routes
│   ├── auth.js      # Authentication routes
│   ├── users.js     # User management routes
│   └── admins.js    # Admin management routes
├── services/        # Business logic services
│   └── eventService.js # RabbitMQ event service
├── app.js           # Express app configuration
└── server.js        # Server entry point
```

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload
- `npm run create-super-admin` - Create the first Super Admin account

## API Documentation

Complete API documentation is available in `API_DOCUMENTATION.md` with:
- Detailed endpoint descriptions
- Request/response examples
- Error scenarios
- Authentication requirements
- Role-based access information
- Testing examples with cURL

## Security Considerations

1. **No Public Registration**: All account creation requires authentication
2. **Role Hierarchy**: Strict role-based account creation permissions
3. **Enhanced Passwords**: Stronger requirements than User Service
4. **Shorter Token Expiration**: Enhanced security with shorter JWT lifetimes
5. **Rate Limiting**: Stricter limits than User Service
6. **Last Super Admin Protection**: Cannot demote the last Super Admin
7. **Audit Trail**: All admin actions are logged and published as events

## Contributing

1. Follow the existing code structure
2. Maintain role-based security principles
3. Add proper error handling and validation
4. Update API documentation for any changes
5. Test role-based access control thoroughly

## License

This project is part of the Library Management System microservices architecture. 