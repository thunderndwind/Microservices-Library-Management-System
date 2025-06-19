# User Service

The User Service handles member authentication and management for the Library Management System.

## Features

- User registration and authentication
- JWT token-based authentication with refresh tokens
- Profile management
- Password hashing with bcrypt
- Rate limiting for security
- Input validation
- Event publishing to RabbitMQ
- Health checks

## Technology Stack

- **Runtime**: Node.js 18
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Message Queue**: RabbitMQ (amqplib)
- **Security**: helmet, cors, express-rate-limit

## Environment Variables

Create a `.env` file based on the example below:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/library_users

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_for_users_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_for_users_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# RabbitMQ Configuration
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_EXCHANGE=library_events

# CORS Configuration
CORS_ORIGIN=http://localhost:3002
```

## API Endpoints

### Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | `/register` | Register new member | `{email, password, firstName, lastName, phone}` | `{user, accessToken, refreshToken}` |
| POST | `/login` | Member login | `{email, password}` | `{user, accessToken, refreshToken}` |
| GET | `/profile` | Get member profile | - | `{user}` |
| PUT | `/profile` | Update member profile | `{firstName, lastName, phone}` | `{user}` |
| POST | `/refresh` | Refresh JWT token | `{refreshToken}` | `{accessToken, refreshToken}` |
| POST | `/logout` | Logout member | `{refreshToken}` (optional) | `{message}` |

### User Routes (`/api/v1/members`)

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/:id` | Get member by ID (self only) | - | `{user}` |
| GET | `/health` | Health check | - | `{status, uptime, userCount}` |

## Installation and Setup

### Local Development

1. **Clone and navigate to the service directory**:
   ```bash
   cd services/user-service
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Start RabbitMQ** (if running locally):
   ```bash
   rabbitmq-server
   ```

6. **Run the service**:
   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

### Docker

1. **Build the Docker image**:
   ```bash
   docker build -t user-service .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3001:3001 --env-file .env user-service
   ```

## Project Structure

```
src/
├── config/          # Configuration files
│   ├── database.js  # MongoDB connection
│   └── jwt.js       # JWT configuration
├── controllers/     # Route controllers
│   ├── authController.js
│   └── userController.js
├── middleware/      # Custom middleware
│   ├── auth.js      # Authentication middleware
│   └── validation.js # Input validation
├── models/          # Mongoose models
│   └── User.js      # User model
├── routes/          # Express routes
│   ├── auth.js      # Authentication routes
│   └── users.js     # User routes
├── services/        # Business logic services
│   └── eventService.js # RabbitMQ event service
├── app.js           # Express app configuration
└── server.js        # Server entry point
```

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (hashed, required),
  firstName: String (required),
  lastName: String (required),
  phone: String (optional),
  status: String (active|suspended|inactive),
  membershipDate: Date,
  refreshTokens: [{
    token: String,
    createdAt: Date (expires after 7 days)
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## Events Published

The service publishes the following events to RabbitMQ:

- `user.registered`: When a new user registers
- `user.profile_updated`: When a user updates their profile

## Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Authentication**: Separate access and refresh tokens
- **Rate Limiting**: Different limits for auth and general endpoints
- **Input Validation**: Server-side validation for all inputs
- **CORS**: Configured for specific origins
- **Helmet**: Security headers protection
- **Error Handling**: Comprehensive error handling with logging

## Health Monitoring

- **Health Check Endpoint**: `GET /health`
- **Docker Health Check**: Built-in health check in Dockerfile
- **Graceful Shutdown**: Proper cleanup on shutdown signals
- **Error Logging**: Comprehensive error logging

## API Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message"
    }
  ]
}
```

## Rate Limiting

- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per IP

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Write meaningful commit messages
5. Test your changes locally

## License

This project is part of the Library Management System microservices architecture. 