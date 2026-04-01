# Prisma + PostgreSQL Setup Guide

## Overview
Backend đã chuyển từ TypeORM sang Prisma với PostgreSQL (Docker).

## Quick Start

### 1. Khởi động PostgreSQL Docker
```bash
docker-compose up -d
```

### 2. Kiểm tra database đã sẵn sàng
```bash
# Chờ khoảng 10-15 giây cho PostgreSQL khởi động
docker-compose logs postgres
```

### 3. Tạo migration đầu tiên
```bash
npm run prisma:migrate
```
Input tên migration: `init` (hoặc tên tùy ý)

### 4. Tạo Prisma Client
```bash
npm run prisma:generate
```

### 5. (Optional) Xem Prisma Studio để quản lý database
```bash
npm run prisma:studio
```
Sẽ mở giao diện web tại http://localhost:5555

### 6. Chạy development server
```bash
npm run start:dev
```

## Environment Variables
`.env` đã được cấu hình để kết nối với Docker database:
```
DATABASE_URL=postgresql://taskmgr:taskmgr123@localhost:5432/task_management
```

Các credentials khớp với docker-compose.yml:
- **User**: taskmgr
- **Password**: taskmgr123
- **Database**: task_management
- **Host**: localhost
- **Port**: 5432

## Cấu trúc Prisma Schema
File: `prisma/schema.prisma`

Models hiện tại:
- **User**: Users của hệ thống (email, password, firstName, lastName)
- **Task**: Tasks được tạo bởi users (title, description, status, priority, dueDate)

## Common Commands

| Command | Mục đích |
|---------|---------|
| `npm run prisma:generate` | Sinh Prisma Client từ schema |
| `npm run prisma:migrate` | Tạo migration (dev mode) |
| `npm run prisma:migrate:prod` | Apply migrations (production) |
| `npm run prisma:studio` | Mở quản lý database UI |
| `npm run db:push` | Push schema trực tiếp lên DB (không recommended cho production) |

## Troubleshooting

### Docker không khởi động
```bash
# Kiểm tra Docker Desktop đã chạy
docker --version

# Nếu chưa chạy, khởi động Docker Desktop
```

### Lỗi kết nối database
```bash
# Kiểm tra container chạy hay không
docker-compose ps

# Xem logs
docker-compose logs postgres

# Restart
docker-compose down
docker-compose up -d
```

### Muốn reset database
```bash
# Xóa migration
rm prisma/migrations -r

# Xóa container
docker-compose down -v

# Khởi động lại
docker-compose up -d
npm run prisma:migrate
```

## API Changes

### Auth - Register
**DTO cũ**: `fullName`
**DTO mới**: `firstName`, `lastName`

```typescript
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "password123",
  "confirmPassword": "password123"
}
```

### Task Relations
**Cũ**: `ownerId`, `assigneeId`
**Mới**: `userId` (chỉ owner)

Tasks hiện tại chỉ có owner (userId), không có assignee. Có thể thêm assignee sau nếu cần.

## Next Steps
1. Khởi động Docker: `docker-compose up -d`
2. Chạy migration: `npm run prisma:migrate`
3. Chạy server: `npm run start:dev`
4. Test API endpoints

Enjoy! 🎉
