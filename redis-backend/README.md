# Student Management System - Backend

A Node.js and Redis-based backend service for the Student Management System with RESTful APIs and JWT authentication.

## 📁 Project Structure

```
redis-backend/
├── server.js              # Main application entry point
├── package.json          # Project dependencies and scripts
└── .env                  # Environment variables (create this)
```

## 🚀 Features

### 1. Authentication System
- JWT-based authentication
- Admin registration with secure code
- Login/logout functionality
- Token verification middleware
- Role-based access control

### 2. Student Management APIs
- CRUD operations for student records
- Bulk operations support
- Data validation
- Error handling
- Search and filter capabilities

### 3. Analytics
- Student statistics
- Course distribution analytics
- Year level distribution
- Real-time data aggregation

### 4. Database
- Redis as primary database
- Hash data structures
- Efficient data retrieval
- Atomic operations

## 🛠️ Technologies Used

- Node.js
- Express.js
- Redis
- JSON Web Tokens (JWT)
- bcryptjs for password hashing
- CORS for cross-origin support

## 📋 Prerequisites

Before running this project, make sure you have:
- Node.js (v14 or higher)
- npm or yarn package manager
- Redis server installed and running
- Git for version control

<br>

## 🚀 Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd redis-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file in the root directory:
```env
PORT=5000
JWT_SECRET=your-secret-key
ADMIN_REGISTRATION_CODE=ADMIN123
REDIS_URL=redis://localhost:6379
```

4. Start Redis server:
```bash
# On Windows (if using WSL)
sudo service redis-server start

# On macOS (using Homebrew)
brew services start redis

# On Linux
sudo systemctl start redis
```

5. Start the server:
```bash
node server.js
```

The server will be running at `http://localhost:5000`

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port number | 5000 |
| JWT_SECRET | Secret key for JWT | your-secret-key |
| ADMIN_REGISTRATION_CODE | Code for admin registration | ADMIN123 |
| REDIS_URL | Redis connection URL | redis://localhost:6379 |

## 🔌 API Endpoints

### Authentication
```
POST /auth/register-admin    # Register new admin
POST /auth/login            # Login user
GET  /auth/verify           # Verify JWT token
```

### Student Management
```
GET    /students           # Get all students
GET    /students/:id       # Get single student
POST   /students          # Create new student
PUT    /students/:id      # Update student
DELETE /students/:id      # Delete student
DELETE /students/all      # Delete all students
```

### Analytics
```
GET /analytics/student-stats    # Get student statistics
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected routes middleware
- Input validation
- Error handling
- CORS protection

## 💾 Data Models

### Student Schema
```javascript
{
  id: String,
  firstName: String,
  lastName: String,
  age: Number,
  address: String,
  studentId: String,
  course: String,
  yearLevel: String,
  section: String,
  major: String
}
```

### User Schema
```javascript
{
  username: String,
  password: String (hashed),
  role: String,
  createdAt: Date
}
```

## 🐛 Error Handling

The API uses standard HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error


## 📊 Performance Considerations

- Redis connection pooling
- Efficient data structures
- Proper error handling
- Request validation
- Response caching (if needed)

## 🛡️ Security Best Practices

1. Environment Variables
   - Use .env for sensitive data
   - Never commit .env files

2. Authentication
   - Secure password hashing
   - JWT token expiration
   - Role-based access

3. Data Validation
   - Input sanitization
   - Type checking
   - Required fields validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
