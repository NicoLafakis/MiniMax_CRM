# Quick Start Checklist - CRM MySQL Migration

## Getting Started

Follow this checklist to migrate your CRM from Supabase to MySQL backend.

---

## Pre-Migration Checklist

### Read Documentation First
- [ ] Read `PROJECT_DELIVERY.md` (overview)
- [ ] Read `MIGRATION_GUIDE.md` (detailed instructions)
- [ ] Review `crm-mysql-backend/README.md` (API docs)

### System Requirements
- [ ] Node.js 18+ installed (`node --version`)
- [ ] MySQL 8.0+ installed (`mysql --version`)
- [ ] npm or pnpm installed
- [ ] Text editor (VS Code recommended)

---

## Phase 1: Backend Setup (2-4 hours)

### Step 1: Install Backend Dependencies
```bash
cd crm-mysql-backend
npm install
```
- [ ] Dependencies installed successfully

### Step 2: Configure Environment
```bash
cp .env.example .env
```
- [ ] Edit `.env` file with:
  - [ ] MySQL credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)
  - [ ] JWT secret (generate random 32+ character string)
  - [ ] Port (default 5000)
  - [ ] CORS origin (frontend URL)

**Example .env**:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=crmapp
DB_PASSWORD=your_strong_password
DB_NAME=crm_database
JWT_SECRET=YOUR_RANDOM_32_CHARACTER_SECRET_KEY_HERE
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:5173
```

### Step 3: Setup MySQL Database
```bash
# Login to MySQL
mysql -u root -p

# In MySQL prompt:
CREATE DATABASE crm_database;
CREATE USER 'crmapp'@'localhost' IDENTIFIED BY 'your_strong_password';
GRANT ALL PRIVILEGES ON crm_database.* TO 'crmapp'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -u crmapp -p crm_database < database/schema.sql
```

- [ ] Database created
- [ ] User created with privileges
- [ ] Schema imported (8 tables created)

**Verify**:
```bash
mysql -u crmapp -p crm_database
SHOW TABLES;
# Should show: users, customers, deals, tickets, activities, contracts, workflow_rules, attachments
```

### Step 4: Start Backend Server
```bash
npm run dev
```

- [ ] Server starts without errors
- [ ] See "CRM MySQL Backend Server Running" message
- [ ] Database connection successful

**Test Backend**:
```bash
# Health check
curl http://localhost:5000/health

# Should return:
# {"status":"ok","message":"CRM API Server Running","timestamp":"..."}
```

- [ ] Health check passes

---

## Phase 2: Frontend Update (4-6 hours)

### Step 1: Install Frontend Dependencies
```bash
cd crm-mysql-frontend
pnpm install
```
- [ ] Dependencies installed (including axios)

### Step 2: Configure Frontend Environment
```bash
cp .env.example .env
```

- [ ] Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Review Migration Example
- [ ] Read `src/pages/CustomersPage-MIGRATED-EXAMPLE.tsx`
- [ ] Understand the migration pattern:
  - Remove Supabase imports
  - Add API client imports
  - Replace Supabase calls with API calls
  - Update error handling

### Step 4: Migrate Pages (One by One)

Use this pattern for each page:

**1. CustomersPage.tsx**
- [ ] Replace Supabase import with API import
- [ ] Update loadCustomers() function
- [ ] Update create/update/delete functions
- [ ] Test functionality

**2. DashboardPage.tsx**
- [ ] Replace Supabase import
- [ ] Update dashboard data fetching
- [ ] Update stats calculations
- [ ] Test metrics display

**3. CustomerDetailPage.tsx**
- [ ] Replace Supabase import
- [ ] Update customer fetching
- [ ] Update activities/deals/tickets loading
- [ ] Test detail view

**4. DealsPage.tsx**
- [ ] Replace Supabase import
- [ ] Update deals fetching
- [ ] Update stage changes
- [ ] Test pipeline functionality

**5. TicketsPage.tsx**
- [ ] Replace Supabase import
- [ ] Update tickets fetching
- [ ] Update status changes
- [ ] Test ticket workflows

**6. ActivitiesPage.tsx**
- [ ] Replace Supabase import
- [ ] Update activities fetching
- [ ] Update task completion
- [ ] Test activity timeline

**7. WorkflowsPage.tsx**
- [ ] Replace Supabase import
- [ ] Update workflows fetching
- [ ] Update rule creation/editing
- [ ] Test automation rules

**8. LoginPage.tsx**
- [ ] Update login/signup functions
- [ ] Remove Supabase auth
- [ ] Use authAPI methods
- [ ] Test authentication

### Step 5: Update Components

**FileAttachments.tsx**:
- [ ] Replace Supabase Storage with attachmentsAPI
- [ ] Update upload function
- [ ] Update download function
- [ ] Test file operations

**EmailComposer.tsx** (if needed):
- [ ] Review for Supabase dependencies
- [ ] Update if necessary

### Step 6: Start Frontend
```bash
pnpm dev
```

- [ ] Frontend starts successfully
- [ ] No console errors
- [ ] Can access http://localhost:5173

---

## Phase 3: Testing (2-3 hours)

### Backend API Testing

**Authentication**:
- [ ] Register new user (POST /api/auth/register)
- [ ] Login user (POST /api/auth/login)
- [ ] Get current user (GET /api/auth/me)
- [ ] Token is returned and stored

**Customers**:
- [ ] Create customer (POST /api/customers)
- [ ] List customers (GET /api/customers)
- [ ] Get single customer (GET /api/customers/:id)
- [ ] Update customer (PUT /api/customers/:id)
- [ ] Delete customer (DELETE /api/customers/:id)

**Deals**:
- [ ] Create deal
- [ ] List deals
- [ ] Update deal stage
- [ ] Delete deal

**Tickets**:
- [ ] Create ticket
- [ ] List tickets
- [ ] Update ticket status
- [ ] Delete ticket

**Activities**:
- [ ] Create activity
- [ ] List activities
- [ ] Mark as complete
- [ ] Delete activity

**Workflows**:
- [ ] Create workflow rule
- [ ] List rules
- [ ] Update rule
- [ ] Delete rule

**Attachments**:
- [ ] Upload file
- [ ] List attachments
- [ ] Download file
- [ ] Delete attachment

### Frontend Integration Testing

**User Flow 1: New User Registration**:
- [ ] Navigate to signup page
- [ ] Register new account
- [ ] Redirected to dashboard
- [ ] Token saved in localStorage

**User Flow 2: Complete Customer Lifecycle**:
- [ ] Login
- [ ] Create new customer
- [ ] View customer detail
- [ ] Edit customer information
- [ ] Add note/activity to customer
- [ ] Upload file attachment
- [ ] Delete customer
- [ ] Verify deletion

**User Flow 3: Sales Pipeline**:
- [ ] Create new deal
- [ ] View pipeline board
- [ ] Move deal through stages
- [ ] Update deal value
- [ ] Mark deal as closed-won

**User Flow 4: Service Desk**:
- [ ] Create ticket
- [ ] Update ticket status
- [ ] Change priority
- [ ] Resolve ticket
- [ ] Close ticket

**User Flow 5: Activity Management**:
- [ ] Create task
- [ ] Set due date
- [ ] Mark as complete
- [ ] View timeline

**User Flow 6: Workflow Automation**:
- [ ] Create automation rule
- [ ] Enable rule
- [ ] Test trigger condition
- [ ] Verify action executes
- [ ] Disable rule

### UI/UX Testing

**Responsive Design**:
- [ ] Test on mobile (< 768px)
- [ ] Test on tablet (768-1024px)
- [ ] Test on desktop (>1024px)
- [ ] All features accessible

**Theme Toggle**:
- [ ] Switch to dark mode
- [ ] Verify all pages render correctly
- [ ] Switch back to light mode
- [ ] Theme preference persists

**Error Handling**:
- [ ] Test invalid login
- [ ] Test network errors
- [ ] Test validation errors
- [ ] Error messages are clear

### Data Isolation Testing

**Multi-user Support**:
- [ ] Register second user
- [ ] Login as user 1
- [ ] Create customers
- [ ] Logout, login as user 2
- [ ] Verify cannot see user 1's customers
- [ ] Create separate data for user 2
- [ ] Verify complete data isolation

---

## Phase 4: Production Deployment (1-2 hours)

### Pre-Deployment Checklist

**Security**:
- [ ] Strong MySQL password
- [ ] Random JWT secret (32+ characters)
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] Environment variables secure

**Backend Production Config**:
- [ ] Update .env with production values
- [ ] NODE_ENV=production
- [ ] Production database credentials
- [ ] Production CORS origin
- [ ] File upload directory writable

**Frontend Production Build**:
```bash
cd crm-mysql-frontend
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
pnpm build
```
- [ ] Build completes successfully
- [ ] dist/ folder created
- [ ] No build errors

### Deployment Steps

See `DEPLOYMENT_GUIDE.md` for your specific platform:

**Option A: Hostinger/cPanel**:
- [ ] MySQL database created via cPanel
- [ ] Schema imported via phpMyAdmin
- [ ] Backend uploaded to ~/crm-backend
- [ ] Dependencies installed
- [ ] Node.js app configured
- [ ] Frontend dist/ uploaded to public_html
- [ ] .htaccess configured

**Option B: VPS (DigitalOcean, AWS)**:
- [ ] Server provisioned
- [ ] Node.js installed
- [ ] MySQL installed and configured
- [ ] Nginx configured
- [ ] SSL certificates installed (certbot)
- [ ] PM2 process manager setup
- [ ] Backend running on PM2
- [ ] Frontend served by Nginx

**Option C: Docker**:
- [ ] docker-compose.yml configured
- [ ] Images built
- [ ] Containers started
- [ ] Database initialized
- [ ] Health checks passing

### Post-Deployment Verification

**Backend**:
- [ ] API health check accessible
- [ ] Can register new user
- [ ] Can login
- [ ] All endpoints responding

**Frontend**:
- [ ] Website loads
- [ ] Can register/login
- [ ] All features work
- [ ] No console errors
- [ ] Theme toggle works
- [ ] Mobile responsive

**Performance**:
- [ ] Page load < 3 seconds
- [ ] API response < 500ms
- [ ] No memory leaks
- [ ] Database queries optimized

---

## Maintenance Checklist

### Daily
- [ ] Monitor server logs
- [ ] Check error rates
- [ ] Verify backups completed

### Weekly
- [ ] Review application logs
- [ ] Check disk space
- [ ] Monitor CPU/memory usage
- [ ] Test backup restoration

### Monthly
- [ ] Update dependencies
- [ ] Review security patches
- [ ] Optimize database
- [ ] Clean old logs

### Database Backup

**Setup Automated Backup**:
```bash
# Create backup script
cat > ~/backup-crm.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u crmapp -pYOUR_PASSWORD crm_database > ~/backups/crm_$DATE.sql
find ~/backups/ -name "crm_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup-crm.sh

# Test backup
~/backup-crm.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * ~/backup-crm.sh
```

- [ ] Backup script created
- [ ] Test backup successful
- [ ] Cron job scheduled
- [ ] Test restore process

---

## Troubleshooting Quick Reference

### Backend Won't Start
1. Check MySQL is running: `sudo systemctl status mysql`
2. Verify credentials in .env
3. Check port 5000 is available: `lsof -i:5000`
4. Review logs: `npm run dev` (check output)

### Frontend Can't Connect
1. Verify backend is running
2. Check VITE_API_URL in .env
3. Check CORS settings in backend
4. Review browser console for errors

### Database Errors
1. Check connection: `mysql -u crmapp -p crm_database`
2. Verify tables exist: `SHOW TABLES;`
3. Check user permissions: `SHOW GRANTS FOR 'crmapp'@'localhost';`

### Authentication Not Working
1. Check JWT_SECRET is set
2. Verify token in localStorage
3. Check token expiration settings
4. Review network tab in browser

---

## Success Criteria

### Backend
✅ All API endpoints working  
✅ Authentication functional  
✅ Database queries optimized  
✅ File uploads working  
✅ No server errors  

### Frontend
✅ All pages render correctly  
✅ CRUD operations work  
✅ Theme toggle functional  
✅ Responsive design verified  
✅ No console errors  

### Integration
✅ End-to-end user flows complete  
✅ Multi-user data isolation verified  
✅ File attachments working  
✅ Performance acceptable  
✅ Security measures in place  

---

## Resources

### Documentation
- `PROJECT_DELIVERY.md` - Overview
- `MIGRATION_GUIDE.md` - Detailed migration steps
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `crm-mysql-backend/README.md` - API reference

### Example Code
- `src/pages/CustomersPage-MIGRATED-EXAMPLE.tsx` - Complete migration example

### Tools
- Postman - API testing
- MySQL Workbench - Database management
- Chrome DevTools - Frontend debugging
- PM2 - Process management

---

## Timeline

**Estimated Total Time**: 9-15 hours

- Backend Setup: 2-4 hours
- Frontend Migration: 4-6 hours
- Testing: 2-3 hours
- Deployment: 1-2 hours

---

## Getting Help

If you encounter issues:

1. Check troubleshooting sections in documentation
2. Review error messages carefully
3. Check server/application logs
4. Verify environment configuration
5. Test with curl/Postman to isolate issues

Common issues and solutions are documented in:
- `MIGRATION_GUIDE.md` (Migration Issues)
- `DEPLOYMENT_GUIDE.md` (Deployment Issues)
- Backend README (API Issues)

---

## Completion

When all checklist items are complete:

✅ **Backend**: Fully functional MySQL API  
✅ **Frontend**: All pages migrated and tested  
✅ **Database**: Schema created with data  
✅ **Authentication**: JWT system working  
✅ **Features**: All CRM features operational  
✅ **Deployment**: Production-ready and deployed  
✅ **Security**: Security measures implemented  
✅ **Backup**: Automated backup system in place  

**Result**: Self-hosted CRM with full control over data and infrastructure!

---

**Good luck with your migration!**

For detailed instructions, refer to the comprehensive documentation provided.
