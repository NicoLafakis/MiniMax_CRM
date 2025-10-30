# CRM MySQL Backend

Backend server for CRM application using Node.js, Express, and MySQL.

## Features

- JWT-based authentication
- REST API for all CRM operations
- File upload/download functionality
- Multi-user support with data isolation
- MySQL database with connection pooling
- Security best practices (helmet, input validation)

## Prerequisites

- Node.js 16+ or 18+
- MySQL 8.0+
- npm or pnpm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your MySQL credentials:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=crm_database
JWT_SECRET=your_secure_random_secret_key
```

4. Create database and tables:
```bash
mysql -u your_username -p < database/schema.sql
```

## Running the Server

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Deals
- `GET /api/deals` - Get all deals
- `GET /api/deals/:id` - Get single deal
- `POST /api/deals` - Create deal
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Tickets
- `GET /api/tickets` - Get all tickets
- `GET /api/tickets/:id` - Get single ticket
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Activities
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get single activity
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Workflows
- `GET /api/workflows` - Get all workflow rules
- `GET /api/workflows/:id` - Get single workflow rule
- `POST /api/workflows` - Create workflow rule
- `PUT /api/workflows/:id` - Update workflow rule
- `DELETE /api/workflows/:id` - Delete workflow rule

### Attachments
- `POST /api/attachments/upload` - Upload file
- `GET /api/attachments/:related_type/:related_id` - Get attachments
- `GET /api/attachments/download/:id` - Download file
- `DELETE /api/attachments/:id` - Delete attachment

## Authentication

All API endpoints (except `/api/auth/*`) require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## File Uploads

Supported file types:
- Images: jpeg, jpg, png, gif
- Documents: pdf, doc, docx, txt
- Spreadsheets: xls, xlsx, csv

Maximum file size: 10MB (configurable in `.env`)

## Database Schema

The application uses the following tables:
- `users` - User accounts and authentication
- `customers` - Customer information
- `deals` - Sales deals/opportunities
- `tickets` - Service tickets
- `activities` - Tasks and activities
- `contracts` - Contract records
- `workflow_rules` - Automation rules
- `attachments` - File metadata

## Deployment

### Hostinger or cPanel Hosting:

1. Upload all files to your hosting directory
2. Create MySQL database via cPanel
3. Import `database/schema.sql` via phpMyAdmin
4. Update `.env` with production credentials
5. Install Node.js dependencies:
   ```bash
   npm install --production
   ```
6. Start server with PM2 or similar:
   ```bash
   npm install -g pm2
   pm2 start server.js --name crm-backend
   pm2 save
   ```

## Security Notes

- Always use HTTPS in production
- Change JWT_SECRET to a strong random value
- Keep .env file secure (never commit to git)
- Set appropriate file permissions (chmod 600 .env)
- Use strong MySQL passwords
- Enable firewall rules for your server

## Support

For issues or questions, contact support or refer to documentation.
