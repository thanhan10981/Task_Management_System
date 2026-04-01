# API Testing Guide

## Setup & Start Server

### 1. Start PostgreSQL with Docker
```bash
cd "c:\Task Management System\Task_Management_BE"
docker-compose up -d
```

Verify database is running:
```bash
docker-compose ps
```

### 2. Create Database & Run Migrations
```bash
npm run prisma:migrate
# Input migration name: init
```

### 3. Start Development Server
```bash
npm run start:dev
```

Server sẽ chạy tại: `http://localhost:3000`

---

## Test APIs with curl

### 1. Register New User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "fullName": "Test User",
    "password": "password123",
    "confirmPassword": "password123"
  }' \
  -v
```

**Expected:**
- Status: 201 Created
- Response: `{ data: { user: {...} }, message: "Registration successful" }`
- Cookies set: `accessToken` (httpOnly), `refreshToken` (httpOnly)
- Log: `[HTTP] {"timestamp":"...", "method":"POST", "url":"/auth/register", "statusCode":201, ...}`

**Note:** Cookies sẽ được set trong response header: `Set-Cookie: accessToken=...; refreshToken=...`

---

### 2. Login User
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }' \
  -v
```

**Expected:**
- Status: 200 OK
- Cookies set: `accessToken`, `refreshToken` (httpOnly)
- Log recorded in console with method/url/statusCode/duration

---

### 3. Get Current User Profile (Protected Route)
```bash
# Trích cookies từ login response
curl -X GET http://localhost:3000/auth/me \
  -H "Cookie: accessToken=<token_from_login>" \
  -v
```

**Expected:**
- Status: 200 OK
- Response: `{ data: { id, email, fullName, ... } }`

---

### 4. Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Cookie: refreshToken=<refresh_token>" \
  -d '' \
  -v
```

**Expected:**
- Status: 200 OK
- New `accessToken` cookie set
- Log recorded

---

### 5. Logout (Protected Route)
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Cookie: accessToken=<token>" \
  -d '' \
  -v
```

**Expected:**
- Status: 200 OK
- Cookies cleared: `Set-Cookie: accessToken=; refreshToken=;`
- Response: `{ message: "Logged out successfully" }`

---

## Check Logs

Tất cả API calls sẽ được logged với format:
```json
{
  "timestamp": "2024-04-01T10:30:00Z",
  "method": "POST",
  "url": "/auth/register",
  "statusCode": 201,
  "duration": "45ms",
  "ip": "::1",
  "body": {
    "email": "test@example.com",
    "password": "***REDACTED***",
    "confirmPassword": "***REDACTED***"
  }
}
```

Logs sẽ xuất hiện trong terminal output khi `npm run start:dev` chạy.

---

## Features Implemented

✅ **Authentication:**
- [x] Register với email validation
- [x] Login với bcrypt password hashing
- [x] httpOnly cookies cho accessToken (15 min) và refreshToken (7 days)
- [x] JWT token generation
- [x] Token refresh endpoint
- [x] Logout (clear cookies)

✅ **Logging:**
- [x] LoggingInterceptor ghi log mỗi API call
- [x] Log format: method, url, statusCode, duration, ip
- [x] Sensitive fields redacted (password, token, etc)
- [x] Error logs (statusCode >= 400)

✅ **Security:**
- [x] Passwords hashed với bcryptjs (salt rounds: 12)
- [x] httpOnly cookies (không accessible từ JS)
- [x] secure flag khi NODE_ENV=production
- [x] sameSite=strict để tránh CSRF
- [x] CORS enabled với credentials support

---

## Troubleshooting

### Database Connection Error
- Kiểm tra Docker: `docker-compose ps`
- Restart: `docker-compose restart db`
- Check .env DATABASE_URL

### JWT Token Issues
- Mọi token được tạo với JWT_SECRET từ .env
- Access token expire: 15 minutes
- Refresh token expire: 7 days
- Sử dụng refreshToken endpoint để lấy access token mới

### Cookies Not Received
- Kiểm tra response headers: `Set-Cookie`
- CORS credentials: phải gửi `credentials: 'include'` từ frontend
- Browser: httpOnly cookies không visible trong devtools → Network tab

---

## Frontend Integration

### Fetch API Example
```javascript
// Register
const response = await fetch('http://localhost:3000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: send cookies
  body: JSON.stringify({
    email: 'user@example.com',
    fullName: 'User Name',
    password: 'password123',
    confirmPassword: 'password123'
  })
});

// Cookies sẽ được tự động set và gửi trong requests tiếp theo
```

### Axios Example
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true // Important: send cookies
});

// Register
await api.post('/auth/register', {
  email: 'user@example.com',
  fullName: 'User Name',
  password: 'password123',
  confirmPassword: 'password123'
});

// Cookies automatically sent in subsequent requests
```
