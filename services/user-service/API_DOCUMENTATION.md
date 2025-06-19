# User Service API Documentation

## Overview
The User Service handles member authentication and management for the Library Management System. It provides endpoints for user registration, authentication, profile management, and member operations.

**Base URL**: `http://localhost:3001/api/v1`  
**Port**: 3001  
**Database**: MongoDB (`library_users` collection)

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Rate Limiting
- **Authentication endpoints**: 5 requests per 15 minutes per IP
- **General endpoints**: 100 requests per 15 minutes per IP

---

## Authentication Endpoints

### 1. Register New User
**POST** `/auth/register`

Register a new library member.

#### Request Body
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

#### Happy Scenario Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "status": "active",
      "membershipDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Bad Scenarios

**Validation Error (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    }
  ]
}
```

**User Already Exists (400 Bad Request)**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Rate Limit Exceeded (429 Too Many Requests)**
```json
{
  "success": false,
  "message": "Too many authentication attempts, please try again later."
}
```

---

### 2. User Login
**POST** `/auth/login`

Authenticate a library member.

#### Request Body
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123"
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "status": "active",
      "membershipDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Bad Scenarios

**Invalid Credentials (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Account Suspended (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Account is suspended or inactive"
}
```

**Missing Fields (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password is required"
    }
  ]
}
```

---

### 3. Get User Profile
**GET** `/auth/profile`

Get the authenticated user's profile information.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "status": "active",
      "membershipDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Missing Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

**Invalid Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid token"
}
```

**Expired Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Token expired"
}
```

**User Not Found (401 Unauthorized)**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 4. Update User Profile
**PUT** `/auth/profile`

Update the authenticated user's profile information.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "firstName": "John Updated",
  "lastName": "Doe Updated",
  "phone": "+1987654321"
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "john.doe@example.com",
      "firstName": "John Updated",
      "lastName": "Doe Updated",
      "phone": "+1987654321",
      "status": "active",
      "membershipDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:45:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Validation Error (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Please provide a valid phone number"
    }
  ]
}
```

**Authentication Required (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

---

### 5. Refresh Token
**POST** `/auth/refresh`

Refresh the access token using a refresh token.

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Bad Scenarios

**Missing Refresh Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Refresh token is required"
}
```

**Invalid Refresh Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

**Expired Refresh Token (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

---

### 6. Logout User
**POST** `/auth/logout`

Logout the authenticated user and invalidate refresh tokens.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Request Body (Optional)
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### Bad Scenarios

**Authentication Required (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

---

## Member Endpoints

### 7. Get Member by ID
**GET** `/members/{id}`

Get member information by ID (users can only access their own data).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `id` (string): User ID

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "status": "active",
      "membershipDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Access Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Access denied. You can only access your own profile."
}
```

**User Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Authentication Required (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Access token is required"
}
```

---

## Health Check Endpoint

### 8. Health Check
**GET** `/members/health`

Check the health status of the User Service.

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "User service is healthy",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.123,
    "totalUsers": 150,
    "memoryUsage": {
      "rss": 45678912,
      "heapTotal": 12345678,
      "heapUsed": 8765432,
      "external": 1234567,
      "arrayBuffers": 123456
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

## Global Health Check

### 9. Service Health Check
**GET** `/health`

Basic health check for the entire User Service.

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "User Service is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600.123
}
```

---

## Error Handling

### Common Error Responses

#### 404 Not Found
```json
{
  "success": false,
  "message": "Route not found"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

#### MongoDB Validation Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

#### Duplicate Key Error (400 Bad Request)
```json
{
  "success": false,
  "message": "email already exists"
}
```

---

## Events Published

The User Service publishes the following events to RabbitMQ:

### user.registered
Published when a new user registers.
```json
{
  "eventType": "user.registered",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "user-service",
  "data": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "john.doe@example.com",
    "firstName": "John",
    "type": "member"
  }
}
```

### user.profile_updated
Published when a user updates their profile.
```json
{
  "eventType": "user.profile_updated",
  "timestamp": "2024-01-15T11:45:00.000Z",
  "source": "user-service",
  "data": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "john.doe@example.com",
    "firstName": "John Updated",
    "lastName": "Doe Updated"
  }
}
```

---

## Testing Examples

### Using cURL

#### Register a new user
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "Test",
    "lastName": "User",
    "phone": "+1234567890"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

#### Get profile (replace TOKEN with actual token)
```bash
curl -X GET http://localhost:3001/api/v1/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

---

## Security Considerations

1. **Password Requirements**: Minimum 6 characters with uppercase, lowercase, and number
2. **JWT Expiration**: Access tokens expire in 24 hours, refresh tokens in 7 days
3. **Rate Limiting**: Strict limits on authentication endpoints
4. **Input Validation**: All inputs are validated and sanitized
5. **Password Hashing**: bcrypt with 12 salt rounds
6. **CORS**: Configured for specific origins only
7. **Security Headers**: Helmet middleware for security headers 