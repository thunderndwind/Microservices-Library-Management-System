# Admin Service API Documentation

## Overview
The Admin Service handles admin and librarian authentication and management for the Library Management System. It provides endpoints for admin authentication, user management, and admin operations with role-based access control.

**Base URL**: `http://localhost:3003/api/v1`  
**Port**: 3003  
**Database**: MongoDB (`library_admins` collection)

## Initial Setup

⚠️ **Important**: Public registration has been disabled for security. You must create the first Super Admin account using the provided script.

### Creating the First Super Admin

1. **Set environment variables** (optional):
   ```bash
   export SUPER_ADMIN_EMAIL=your-email@library.com
   export SUPER_ADMIN_PASSWORD=YourSecurePassword123!
   export SUPER_ADMIN_FIRST_NAME=Your
   export SUPER_ADMIN_LAST_NAME=Name
   ```

2. **Run the super admin creation script**:
   ```bash
   cd services/admin-service
   npm run create-super-admin
   ```

3. **Default credentials** (if no environment variables set):
   - Email: `superadmin@library.com`
   - Password: `SuperAdmin123!`
   - Role: `super_admin`

4. **⚠️ Security**: Change the default password immediately after first login!

### Account Creation Hierarchy

After the initial Super Admin is created:
- **Super Admin** can create: Super Admin, Admin, Librarian accounts
- **Admin** can create: Librarian accounts only
- **Librarian** cannot create any accounts

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Rate Limiting (Stricter than User Service)
- **Authentication endpoints**: 3 requests per 15 minutes per IP
- **General endpoints**: 50 requests per 15 minutes per IP
- **Admin management**: 30 requests per 15 minutes per IP

## Roles and Permissions
- **Super Admin**: Full system access, can create/manage all roles
- **Admin**: Limited access, can only create/manage librarians
- **Librarian**: Basic access, cannot manage other admin accounts

### Permission Matrix
| Permission | Super Admin | Admin | Librarian |
|------------|-------------|-------|-----------|
| manage_books | ✅ | ✅ | ✅ |
| manage_users | ✅ | ✅ | ✅ |
| manage_reservations | ✅ | ✅ | ✅ |
| view_reports | ✅ | ✅ | ✅ |
| manage_admins | ✅ | ✅ | ❌ |
| manage_super_admins | ✅ | ❌ | ❌ |
| system_config | ✅ | ✅ | ❌ |

### Role Creation Permissions
| Current Role | Can Create |
|--------------|------------|
| Super Admin | Super Admin, Admin, Librarian |
| Admin | Librarian only |
| Librarian | None |

---

## Authentication Endpoints

### 1. Register New Admin/Librarian
**POST** `/auth/register`

⚠️ **Authentication Required**: Only authenticated Super Admin or Admin can create new accounts.

Register a new admin or librarian (requires authentication and appropriate permissions).

#### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Request Body
```json
{
  "email": "admin@library.com",
  "password": "SecureAdmin123!",
  "firstName": "John",
  "lastName": "Admin",
  "phone": "+1234567890",
  "role": "admin"
}
```

#### Happy Scenario Response (201 Created)
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "admin": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "admin@library.com",
      "firstName": "John",
      "lastName": "Admin",
      "phone": "+1234567890",
      "role": "admin",
      "permissions": [
        "manage_books",
        "manage_users",
        "manage_reservations",
        "view_reports",
        "manage_admins",
        "system_config"
      ],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
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

**Insufficient Permissions (403 Forbidden)**
```json
{
  "success": false,
  "message": "Only super admin can create admin accounts"
}
```

**Role Restriction (403 Forbidden)**
```json
{
  "success": false,
  "message": "Admin can only create librarian accounts"
}
```

**Validation Error - Invalid Role (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "role",
      "message": "Role must be super_admin, admin, or librarian"
    }
  ]
}
```

**Validation Error - Weak Password (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  ]
}
```

**Admin Already Exists (400 Bad Request)**
```json
{
  "success": false,
  "message": "Admin with this email already exists"
}
```

**Rate Limit Exceeded (429 Too Many Requests)**
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```

---

### 2. Admin Login
**POST** `/auth/login`

Authenticate an admin or librarian.

#### Request Body
```json
{
  "email": "admin@library.com",
  "password": "SecureAdmin123!"
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "admin@library.com",
      "firstName": "John",
      "lastName": "Admin",
      "phone": "+1234567890",
      "role": "admin",
      "permissions": [
        "manage_books",
        "manage_users",
        "manage_reservations",
        "view_reports",
        "manage_admins",
        "system_config"
      ],
      "lastLogin": "2024-01-15T10:30:00.000Z",
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

**Missing Fields (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

---

### 3. Get Admin Profile
**GET** `/auth/profile`

Get the authenticated admin's profile information.

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
    "admin": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "admin@library.com",
      "firstName": "John",
      "lastName": "Admin",
      "phone": "+1234567890",
      "role": "admin",
      "permissions": [
        "manage_books",
        "manage_users",
        "manage_reservations",
        "view_reports",
        "manage_admins",
        "system_config"
      ],
      "lastLogin": "2024-01-15T10:30:00.000Z",
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

---

### 4. Update Admin Profile
**PUT** `/auth/profile`

Update the authenticated admin's profile information.

#### Headers
```
Authorization: Bearer <access_token>
```

#### Request Body
```json
{
  "firstName": "John Updated",
  "lastName": "Admin Updated",
  "phone": "+1987654321"
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "admin": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "admin@library.com",
      "firstName": "John Updated",
      "lastName": "Admin Updated",
      "phone": "+1987654321",
      "role": "admin",
      "permissions": [
        "manage_books",
        "manage_users",
        "manage_reservations",
        "view_reports",
        "manage_admins",
        "system_config"
      ],
      "lastLogin": "2024-01-15T10:30:00.000Z",
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

---

### 5. Refresh Token
**POST** `/auth/refresh`

Refresh the access token using a refresh token (24-hour expiration for admins).

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

---

### 6. Logout Admin
**POST** `/auth/logout`

Logout the authenticated admin and invalidate refresh tokens.

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

---

## User Management Endpoints

### 7. Get All Users
**GET** `/users`

Get all library members with pagination and search (requires `manage_users` permission).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10)
- `search` (string, optional): Search term for name or email

#### Example Request
```
GET /api/v1/users?page=1&limit=10&search=john
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
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
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Bad Scenarios

**Permission Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Permission 'manage_users' required"
}
```

**Authentication Required (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**User Service Unavailable (500 Internal Server Error)**
```json
{
  "success": false,
  "message": "Failed to retrieve users"
}
```

---

### 8. Get User by ID
**GET** `/users/{id}`

Get a specific library member by ID (requires `manage_users` permission).

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

**User Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Permission Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Permission 'manage_users' required"
}
```

---

### 9. Update User Status
**PUT** `/users/{id}/status`

Update a library member's status (suspend/activate) (requires `manage_users` permission).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `id` (string): User ID

#### Request Body
```json
{
  "status": "suspended",
  "reason": "Overdue books not returned"
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "User status updated successfully",
  "data": {
    "user": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "status": "suspended",
      "membershipDate": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Invalid Status (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "status",
      "message": "Status must be active, suspended, or inactive"
    }
  ]
}
```

**User Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "User not found"
}
```

**Permission Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Permission 'manage_users' required"
}
```

---

### 10. Delete User
**DELETE** `/users/{id}`

Delete a library member account (requires `manage_admins` permission - Admin only).

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
  "message": "User deleted successfully"
}
```

#### Bad Scenarios

**Permission Denied (403 Forbidden)**
```json
{
  "success": false,
  "message": "Permission 'manage_admins' required"
}
```

**User Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

## Admin Management Endpoints

### 11. Get All Admins
**GET** `/admins`

Get all admins and librarians (requires Admin or Super Admin role).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Admins retrieved successfully",
  "data": {
    "admins": [
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "email": "superadmin@library.com",
        "firstName": "Super",
        "lastName": "Admin",
        "phone": "+1234567890",
        "role": "super_admin",
        "permissions": [
          "manage_books",
          "manage_users",
          "manage_reservations",
          "view_reports",
          "manage_admins",
          "manage_super_admins",
          "system_config"
        ],
        "lastLogin": "2024-01-15T10:30:00.000Z",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "email": "admin@library.com",
        "firstName": "John",
        "lastName": "Admin",
        "phone": "+1234567891",
        "role": "admin",
        "permissions": [
          "manage_books",
          "manage_users",
          "manage_reservations",
          "view_reports",
          "manage_admins",
          "system_config"
        ],
        "lastLogin": "2024-01-15T09:15:00.000Z",
        "createdAt": "2024-01-14T14:20:00.000Z",
        "updatedAt": "2024-01-15T09:15:00.000Z"
      },
      {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
        "email": "librarian@library.com",
        "firstName": "Jane",
        "lastName": "Librarian",
        "phone": "+1234567892",
        "role": "librarian",
        "permissions": [
          "manage_books",
          "manage_users",
          "manage_reservations",
          "view_reports"
        ],
        "lastLogin": "2024-01-15T08:30:00.000Z",
        "createdAt": "2024-01-13T16:45:00.000Z",
        "updatedAt": "2024-01-15T08:30:00.000Z"
      }
    ]
  }
}
```

#### Bad Scenarios

**Role Required (403 Forbidden)**
```json
{
  "success": false,
  "message": "Role 'super_admin or admin' required"
}
```

**Authentication Required (401 Unauthorized)**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

---

### 12. Update Admin Role
**PUT** `/admins/{id}/role`

Update an admin's role (requires appropriate permissions based on role hierarchy).

#### Headers
```
Authorization: Bearer <access_token>
```

#### Path Parameters
- `id` (string): Admin ID

#### Request Body
```json
{
  "role": "admin"
}
```

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Admin role updated successfully",
  "data": {
    "admin": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "email": "admin@library.com",
      "firstName": "John",
      "lastName": "Admin",
      "phone": "+1234567891",
      "role": "admin",
      "permissions": [
        "manage_books",
        "manage_users",
        "manage_reservations",
        "view_reports",
        "manage_admins",
        "system_config"
      ],
      "lastLogin": "2024-01-15T09:15:00.000Z",
      "createdAt": "2024-01-14T14:20:00.000Z",
      "updatedAt": "2024-01-15T12:30:00.000Z"
    }
  }
}
```

#### Bad Scenarios

**Cannot Change Own Role (400 Bad Request)**
```json
{
  "success": false,
  "message": "Cannot change your own role"
}
```

**Insufficient Permissions (403 Forbidden)**
```json
{
  "success": false,
  "message": "Only super admin can assign admin role"
}
```

**Role Restriction (403 Forbidden)**
```json
{
  "success": false,
  "message": "Admin can only modify librarian accounts and assign librarian role"
}
```

**Cannot Demote Last Super Admin (400 Bad Request)**
```json
{
  "success": false,
  "message": "Cannot demote the last super admin"
}
```

**Invalid Role (400 Bad Request)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "role",
      "message": "Role must be super_admin, admin, or librarian"
    }
  ]
}
```

**Admin Not Found (404 Not Found)**
```json
{
  "success": false,
  "message": "Admin not found"
}
```

**Role Required (403 Forbidden)**
```json
{
  "success": false,
  "message": "Role 'super_admin or admin' required"
}
```

---

## Health Check Endpoints

### 13. Admin Health Check
**GET** `/admins/health`

Check the health status of the Admin Service.

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Admin service is healthy",
  "data": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600.123,
    "totalAdmins": 5,
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

### 14. Global Health Check
**GET** `/health`

Basic health check for the entire Admin Service.

#### Happy Scenario Response (200 OK)
```json
{
  "success": true,
  "message": "Admin Service is running",
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

The Admin Service publishes the following events to RabbitMQ:

### admin.registered
Published when a new admin/librarian registers.
```json
{
  "eventType": "admin.registered",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "admin-service",
  "data": {
    "adminId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "admin@library.com",
    "firstName": "John",
    "role": "admin"
  }
}
```

### admin.login
Published when an admin/librarian logs in.
```json
{
  "eventType": "admin.login",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "admin-service",
  "data": {
    "adminId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "admin@library.com",
    "role": "admin",
    "loginTime": "2024-01-15T10:30:00.000Z"
  }
}
```

### user.suspended
Published when an admin suspends a user.
```json
{
  "eventType": "user.suspended",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "source": "admin-service",
  "data": {
    "userId": "64f8a1b2c3d4e5f6a7b8c9d0",
    "suspendedBy": "64f8a1b2c3d4e5f6a7b8c9d1",
    "reason": "Overdue books not returned"
  }
}
```

---

## Testing Examples

### Using cURL

#### Create the first Super Admin (one-time setup)
```bash
cd services/admin-service
npm run create-super-admin
```

#### Login as Super Admin
```bash
curl -X POST http://localhost:3003/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@library.com",
    "password": "SuperAdmin123!"
  }'
```

#### Register a new admin (requires Super Admin token)
```bash
curl -X POST http://localhost:3003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -d '{
    "email": "admin@library.com",
    "password": "SecureAdmin123!",
    "firstName": "John",
    "lastName": "Admin",
    "role": "admin"
  }'
```

#### Register a new librarian (requires Admin or Super Admin token)
```bash
curl -X POST http://localhost:3003/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "email": "librarian@library.com",
    "password": "SecureLibrarian123!",
    "firstName": "Jane",
    "lastName": "Librarian",
    "role": "librarian"
  }'
```

#### Get all users (replace TOKEN with actual token)
```bash
curl -X GET "http://localhost:3003/api/v1/users?page=1&limit=10" \
  -H "Authorization: Bearer TOKEN"
```

#### Suspend a user
```bash
curl -X PUT http://localhost:3003/api/v1/users/USER_ID/status \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended",
    "reason": "Overdue books"
  }'
```

#### Get all admins
```bash
curl -X GET http://localhost:3003/api/v1/admins \
  -H "Authorization: Bearer TOKEN"
```

#### Update admin role (Super Admin only for admin/super_admin roles)
```bash
curl -X PUT http://localhost:3003/api/v1/admins/ADMIN_ID/role \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

---

## Security Considerations

1. **Enhanced Password Requirements**: Minimum 8 characters with uppercase, lowercase, number, and special character
2. **Shorter JWT Expiration**: Access tokens expire in 8 hours, refresh tokens in 24 hours
3. **Stricter Rate Limiting**: Lower limits than user service for enhanced security
4. **Role-Based Access Control**: Granular permissions system
5. **Permission Validation**: Each endpoint validates required permissions
6. **Service-to-Service Authentication**: Secure communication with User Service
7. **Audit Trail**: All admin actions are logged and published as events
8. **Input Validation**: Comprehensive validation for all inputs
9. **CORS**: Configured for admin frontend origin only
10. **Security Headers**: Enhanced helmet configuration

---

## Inter-Service Communication

The Admin Service communicates with the User Service for member management operations. All requests include a service token for authentication:

```
X-Service-Token: internal-service-token-change-in-production
```

### Service Endpoints Called
- `GET /api/v1/internal/users` - Get all users
- `GET /api/v1/internal/users/{id}` - Get user by ID
- `PUT /api/v1/internal/users/{id}/status` - Update user status
- `DELETE /api/v1/internal/users/{id}` - Delete user

**Note**: These internal endpoints need to be implemented in the User Service for the Admin Service to function properly. 