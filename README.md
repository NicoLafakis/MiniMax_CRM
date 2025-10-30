# CRM System - MySQL Backend Migration

Complete migration package for transitioning the CRM application from Supabase to MySQL + Node.js backend.

## Overview

This package contains everything needed to run a full-featured CRM application with:

- **Modern Minimalist UI** - Clean, professional interface with light/dark themes
- **Customer Management** - Complete contact database with activity tracking
- **Sales Pipeline** - Visual deal management with drag-and-drop stages
- **Service Desk** - Ticket management system with workflows
- **Activity Timeline** - Task management and interaction history
- **Workflow Automation** - Rule-based automation engine
- **File Attachments** - Upload and manage documents
- **Multi-User Support** - Up to 20 users with data isolation
- **JWT Authentication** - Secure email/password authentication
- **Self-Hosted** - Full control over your data and infrastructure

## Package Contents

```
├── crm-mysql-backend/      # Node.js/Express API server
├── crm-mysql-frontend/     # React frontend application
├── MIGRATION_GUIDE.md      # Step-by-step migration instructions
├── DEPLOYMENT_GUIDE.md     # Production deployment guide
└── README.md               # This file
```

## Quick Start

### Prerequisites

- Node.js 16+ or 18+
- MySQL 8.0+
- npm or pnpm package manager

### 1. Setup Database

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE crm_database;
CREATE USER 'crmapp'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON crm_database.* TO 'crmapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u crmapp -p crm_database < crm-mysql-backend/database/schema.sql
```

### 2. Setup Backend

```bash
cd crm-mysql-backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
npm run dev
```

Backend will start on http://localhost:5000

### 3. Setup Frontend

```bash
cd crm-mysql-frontend
pnpm install
cp .env.example .env
# Edit .env (default points to localhost:5000)
pnpm dev
```

Frontend will start on http://localhost:5173

### 4. Create Your Account

1. Open http://localhost:5173
2. Click "Sign up"
3. Enter your email and password
4. Start using the CRM!

## Features

### Customer Management
- Comprehensive contact database
- Custom fields and tags
- Activity timeline per customer
- Notes and call logs
- File attachments

### Sales Pipeline
- Visual kanban board
- Customizable deal stages
- Deal value tracking
- Probability scoring
- Expected close dates
- Contract management

### Service Desk
- Ticket creation and tracking
- Status workflows (New, In Progress, Pending, Resolved, Closed)
- Priority levels (Low, Medium, High, Urgent)
- Customer association
- SLA tracking

### Activity Hub
- Task management
- Activity timeline
- Email composition interface
- Due date tracking
- Completion status

### Workflow Automation
- Trigger-based automation
- Custom action rules
- Enable/disable rules
- Multiple trigger types
- Flexible action system

### File Management
- Upload attachments to customers, deals, tickets
- Supported formats: Images, PDFs, Documents, Spreadsheets
- 10MB file size limit (configurable)
- Secure file storage
- Download functionality

### Authentication & Security
- JWT-based authentication
- Secure password hashing (bcrypt)
- Token-based sessions
- Multi-user support with data isolation
- Role-based access (foundation in place)

### User Interface
- Modern Minimalism design
- Light and dark themes
- Fully responsive (mobile, tablet, desktop)
- Smooth animations
- Clean, professional aesthetics
- Accessibility compliant

## Technology Stack

### Backend
- Node.js 18
- Express.js 4
- MySQL 8.0
- JWT authentication
- Multer (file uploads)
- bcryptjs (password hashing)
- Helmet.js (security)

### Frontend
- React 18
- TypeScript
- Vite 6
- TailwindCSS
- Radix UI components
- React Router
- Axios
- Lucide icons

## Architecture

### Backend Structure
```
crm-mysql-backend/
├── config/
│   └── database.js          # MySQL connection pool
├── middleware/
│   └── auth.js              # JWT authentication
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── customers.js         # Customer CRUD
│   ├── deals.js             # Deal management
│   ├── tickets.js           # Ticket management
│   ├── activities.js        # Activity tracking
│   ├── workflows.js         # Workflow automation
│   └── attachments.js       # File upload/download
├── database/
│   └── schema.sql           # MySQL database schema
└── server.js                # Main application server
```

### Frontend Structure
```
crm-mysql-frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/            # React contexts (Auth, Theme)
│   ├── lib/
│   │   ├── api.ts          # API client
│   │   └── utils.ts        # Utility functions
│   └── pages/              # Application pages
│       ├── DashboardPage.tsx
│       ├── CustomersPage.tsx
│       ├── CustomerDetailPage.tsx
│       ├── DealsPage.tsx
│       ├── TicketsPage.tsx
│       ├── ActivitiesPage.tsx
│       ├── WorkflowsPage.tsx
│       └── LoginPage.tsx
```

### Database Schema
- **users** - User accounts and authentication
- **customers** - Customer information and contacts
- **deals** - Sales opportunities and pipeline
- **tickets** - Service desk tickets
- **activities** - Tasks and interaction history
- **contracts** - Contract records
- **workflow_rules** - Automation rules
- **attachments** - File metadata and storage

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/:id` - Get customer details
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Deals
- `GET /api/deals` - List all deals
- `GET /api/deals/:id` - Get deal details
- `POST /api/deals` - Create deal
- `PUT /api/deals/:id` - Update deal
- `DELETE /api/deals/:id` - Delete deal

### Tickets
- `GET /api/tickets` - List all tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets` - Create ticket
- `PUT /api/tickets/:id` - Update ticket
- `DELETE /api/tickets/:id` - Delete ticket

### Activities
- `GET /api/activities` - List all activities
- `GET /api/activities/:id` - Get activity details
- `POST /api/activities` - Create activity
- `PUT /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Workflows
- `GET /api/workflows` - List all workflow rules
- `GET /api/workflows/:id` - Get workflow rule
- `POST /api/workflows` - Create workflow rule
- `PUT /api/workflows/:id` - Update workflow rule
- `DELETE /api/workflows/:id` - Delete workflow rule

### Attachments
- `POST /api/attachments/upload` - Upload file
- `GET /api/attachments/:type/:id` - Get attachments
- `GET /api/attachments/download/:id` - Download file
- `DELETE /api/attachments/:id` - Delete attachment

All endpoints (except auth) require JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Configuration

### Backend Environment (.env)

The backend requires environment variables for database connection and security settings.

**Location**: `crm-mysql-backend/.env`

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=193.203.166.21
DB_PORT=3306
DB_USER=u446811592_freecrm
DB_PASSWORD=V2vNbo3;
DB_NAME=u446811592_freecrm

# JWT Configuration
JWT_SECRET=your_secret_key_min_32_characters_change_this_in_production
JWT_EXPIRES_IN=7d

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# CORS Configuration
CORS_ORIGIN=*
```

**Key Points**:
- `DB_HOST`: Remote MySQL server address (193.203.166.21)
- `DB_PORT`: MySQL port (default 3306)
- `DB_USER`: MySQL username for authentication
- `DB_PASSWORD`: MySQL password for authentication
- `DB_NAME`: Database name on the remote server
- `JWT_SECRET`: Change this to a strong random string in production
- `CORS_ORIGIN`: Set to your frontend domain in production (e.g., `https://yourdomain.com`)

### Frontend Environment (.env)

The frontend needs to know where to find the API backend.

**Location**: `crm-mysql-frontend/.env`

```env
# Frontend API Configuration
VITE_API_URL=http://localhost:5000/api
```

**Key Points**:
- `VITE_API_URL`: URL where the backend API is running
- For local development: `http://localhost:5000/api`
- For production: Use your backend server URL (e.g., `https://api.yourdomain.com/api`)

## Deployment

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions for:
- Hostinger cPanel hosting
- VPS/Cloud hosting (DigitalOcean, AWS, etc.)
- Docker containers

### Quick Production Deploy

1. **Build Frontend**:
```bash
cd crm-mysql-frontend
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
pnpm build
# Upload dist/ folder to web server
```

2. **Deploy Backend**:
```bash
cd crm-mysql-backend
npm install --production
# Configure .env with production settings
pm2 start server.js --name crm-backend
```

3. **Setup Database**:
```bash
mysql -u username -p < database/schema.sql
```

## Migration from Supabase

If you're migrating from the original Supabase version:

1. Review `MIGRATION_GUIDE.md` for detailed instructions
2. All data structures are compatible
3. Export data from Supabase
4. Import into MySQL
5. Update user ID mappings

Estimated migration time: 9-15 hours

## Security

- JWT tokens with configurable expiration
- Bcrypt password hashing (10 rounds)
- SQL injection protection (parameterized queries)
- XSS protection (Helmet.js)
- CORS configuration
- File upload validation
- Input sanitization
- HTTPS recommended for production

## Performance

- MySQL connection pooling (10 connections)
- Database indexes on key fields
- Efficient query patterns
- Static asset caching
- Gzip compression
- PM2 process management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## Responsive Breakpoints

- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1279px
- Large Desktop: ≥ 1280px

## Known Limitations

- File uploads limited to 10MB (configurable)
- No real-time updates (polling required)
- Single database instance (no sharding)
- No built-in email sending (SMTP integration needed)
- No calendar integration (future enhancement)

## Future Enhancements

- Real-time notifications with WebSockets
- Advanced reporting and analytics
- Email integration (SMTP, IMAP)
- Calendar synchronization
- Mobile apps (React Native)
- Advanced permissions system
- Data export/import tools
- Audit logging
- Two-factor authentication

## Support & Documentation

- **Migration Guide**: See `MIGRATION_GUIDE.md`
- **Deployment Guide**: See `DEPLOYMENT_GUIDE.md`
- **Backend Documentation**: See `crm-mysql-backend/README.md`
- **API Documentation**: All endpoints documented in route files

## Troubleshooting

### Backend Issues

**Cannot connect to database**:
- Verify MySQL is running
- Check credentials in `.env`
- Ensure database exists
- Check MySQL port (default 3306)

**Port 5000 already in use**:
- Change PORT in `.env`
- Kill process using port: `lsof -ti:5000 | xargs kill`

### Frontend Issues

**Cannot connect to API**:
- Verify backend is running
- Check VITE_API_URL in `.env`
- Check CORS settings in backend
- Review browser console for errors

**Login not working**:
- Check JWT_SECRET is set
- Verify token in localStorage
- Check network tab for API errors

### Database Issues

**Slow queries**:
```sql
-- Check running queries
SHOW PROCESSLIST;

-- Optimize tables
OPTIMIZE TABLE customers;
```

**Connection pool exhausted**:
- Increase connectionLimit in `config/database.js`
- Check for connection leaks
- Monitor active connections

## License

This is a private deployment package. All rights reserved.

## Credits

- **Design System**: Modern Minimalism with Dark Mode
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **Styling**: TailwindCSS
- **Build Tool**: Vite

## Version

**Version**: 1.0.0  
**Release Date**: 2025-10-31  
**Status**: Production Ready

---

For detailed setup instructions, see `MIGRATION_GUIDE.md` and `DEPLOYMENT_GUIDE.md`.

For questions or issues, contact support or refer to the troubleshooting sections in the documentation.
