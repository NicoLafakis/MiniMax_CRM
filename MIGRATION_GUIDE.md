# CRM Migration Guide: Supabase to MySQL Backend

## Overview

This document guides you through migrating the existing Supabase-based CRM to a MySQL + Node.js backend.

## What's Changed

### Backend Architecture
- **Before**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **After**: Node.js/Express + MySQL + JWT Authentication + File System Storage

### Authentication
- **Before**: Supabase Auth with magic links
- **After**: JWT-based authentication with email/password
- Tokens stored in localStorage
- Automatic token refresh on API calls

### Database
- **Before**: PostgreSQL via Supabase
- **After**: MySQL with connection pooling
- All table structures preserved
- UUIDs replaced with VARCHAR(36)

### File Storage
- **Before**: Supabase Storage buckets
- **After**: Local file system in `uploads/` directory
- Files stored on web server
- Metadata tracked in `attachments` table

## Migration Steps

### Step 1: Backend Setup

1. **Install Dependencies**:
```bash
cd crm-mysql-backend
npm install
```

2. **Configure Environment**:
```bash
cp .env.example .env
```

Edit `.env` with your MySQL credentials:
```env
DB_HOST=your_mysql_host
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=crm_database
JWT_SECRET=generate_a_strong_random_secret
```

3. **Create Database**:
```bash
mysql -u your_username -p < database/schema.sql
```

4. **Test Backend**:
```bash
npm run dev
```

Server should start on `http://localhost:5000`

### Step 2: Frontend Update

1. **Install Dependencies**:
```bash
cd crm-mysql-frontend
pnpm install
```

2. **Configure API URL**:
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

3. **Test Frontend**:
```bash
pnpm dev
```

Application should start on `http://localhost:5173`

### Step 3: Code Migration Pattern

#### Authentication Changes

**Before (Supabase)**:
```typescript
import { supabase } from '../lib/supabase'

// Login
const { error } = await supabase.auth.signInWithPassword({ email, password })

// Get user
const { data: { user } } = await supabase.auth.getUser()
```

**After (MySQL Backend)**:
```typescript
import { authAPI } from '../lib/api'

// Login
const response = await authAPI.login(email, password)
const { token, user } = response.data

// Get user
const response = await authAPI.getUser()
const user = response.data.user
```

#### Data Fetching Changes

**Before (Supabase)**:
```typescript
// Get customers
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('user_id', user?.id)
  .order('created_at', { ascending: false })

// Create customer
const { data, error } = await supabase
  .from('customers')
  .insert([{ name, email, ... }])
  .select()
```

**After (MySQL Backend)**:
```typescript
// Get customers
const response = await customersAPI.getAll()
const customers = response.data

// Create customer
const response = await customersAPI.create({ name, email, ... })
const newCustomer = response.data
```

#### File Upload Changes

**Before (Supabase)**:
```typescript
// Upload to Supabase Storage
const { data, error } = await supabase.storage
  .from('crm-attachments')
  .upload(`${user.id}/${fileName}`, file)
```

**After (MySQL Backend)**:
```typescript
// Upload to backend
const response = await attachmentsAPI.upload(file, 'customer', customerId)
const attachment = response.data
```

### Step 4: Update All Pages

You need to update these files to use the new API:

#### Core Files:
- `src/lib/api.ts` - Already created (new API client)
- `src/contexts/AuthContext.tsx` - Already updated

#### Pages to Update:
1. `src/pages/CustomersPage.tsx`
2. `src/pages/CustomerDetailPage.tsx`
3. `src/pages/DashboardPage.tsx`
4. `src/pages/DealsPage.tsx`
5. `src/pages/TicketsPage.tsx`
6. `src/pages/ActivitiesPage.tsx`
7. `src/pages/WorkflowsPage.tsx`
8. `src/pages/LoginPage.tsx`

#### Components to Update:
1. `src/components/FileAttachments.tsx`
2. `src/components/EmailComposer.tsx` (if it uses Supabase)

### Step 5: Migration Script Template

For each page, follow this pattern:

1. **Remove Supabase Import**:
```typescript
// DELETE THIS
import { supabase, Customer } from '../lib/supabase'
```

2. **Add New API Import**:
```typescript
// ADD THIS
import { customersAPI, Customer } from '../lib/api'
```

3. **Update Data Fetching**:
```typescript
// BEFORE
const { data, error } = await supabase
  .from('customers')
  .select('*')
  .eq('user_id', user?.id)

// AFTER
const response = await customersAPI.getAll()
const customers = response.data
```

4. **Update Error Handling**:
```typescript
// BEFORE
if (error) throw error

// AFTER
try {
  const response = await customersAPI.getAll()
  // handle response
} catch (error) {
  console.error('Error:', error)
  // handle error
}
```

5. **Update CRUD Operations**:

**Create**:
```typescript
// BEFORE
const { data, error } = await supabase
  .from('customers')
  .insert([formData])
  .select()

// AFTER
const response = await customersAPI.create(formData)
const newCustomer = response.data
```

**Update**:
```typescript
// BEFORE
const { error } = await supabase
  .from('customers')
  .update(formData)
  .eq('id', customerId)

// AFTER
await customersAPI.update(customerId, formData)
```

**Delete**:
```typescript
// BEFORE
const { error } = await supabase
  .from('customers')
  .delete()
  .eq('id', customerId)

// AFTER
await customersAPI.delete(customerId)
```

## Deployment

### Hostinger Deployment

#### Backend Deployment:

1. **Upload Files**:
   - Upload entire `crm-mysql-backend/` folder to your hosting

2. **Install Dependencies**:
```bash
cd crm-mysql-backend
npm install --production
```

3. **Setup MySQL**:
   - Create database via cPanel
   - Import `database/schema.sql` via phpMyAdmin
   - Update `.env` with production credentials

4. **Start Server**:
```bash
# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start server.js --name crm-backend
pm2 save
pm2 startup
```

5. **Configure Nginx/Apache**:
   - Point API subdomain to Node.js server
   - Example: `api.yourdomain.com` → `localhost:5000`

#### Frontend Deployment:

1. **Update API URL**:
```bash
# Edit .env
VITE_API_URL=https://api.yourdomain.com/api
```

2. **Build**:
```bash
cd crm-mysql-frontend
pnpm install
pnpm build
```

3. **Upload**:
   - Upload `dist/` folder contents to public_html

4. **Configure Web Server**:
   - Set up React Router fallback (all routes → index.html)

**Apache (.htaccess)**:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Data Migration (Optional)

If you want to migrate existing Supabase data to MySQL:

1. **Export from Supabase**:
```sql
-- Use Supabase SQL Editor to export data
COPY (SELECT * FROM customers) TO STDOUT WITH CSV HEADER;
```

2. **Import to MySQL**:
```bash
mysql -u username -p crm_database < exported_data.sql
```

3. **Update User IDs**:
   - Supabase user IDs are UUIDs
   - Create user accounts in new system
   - Map old user IDs to new ones
   - Update foreign keys in all tables

## Testing Checklist

### Backend Testing:
- [ ] Database connection successful
- [ ] User registration works
- [ ] User login works
- [ ] Token authentication works
- [ ] CRUD operations for all entities
- [ ] File upload works
- [ ] File download works
- [ ] Error handling works

### Frontend Testing:
- [ ] Login page works
- [ ] Dashboard loads correctly
- [ ] Customers page displays data
- [ ] Customer creation works
- [ ] Customer editing works
- [ ] Customer deletion works
- [ ] Deals pipeline works
- [ ] Tickets management works
- [ ] Activities timeline works
- [ ] Workflow automation works
- [ ] File attachments work
- [ ] Theme toggle works
- [ ] Mobile responsive

### Integration Testing:
- [ ] End-to-end user registration and login
- [ ] Complete customer lifecycle (create, view, edit, delete)
- [ ] Deal stage progression
- [ ] Ticket status workflows
- [ ] File upload and download
- [ ] Multi-user data isolation

## Troubleshooting

### Common Issues:

**Backend won't start**:
- Check MySQL credentials in `.env`
- Verify MySQL server is running
- Check port 5000 is not in use
- Review server logs for errors

**Frontend can't connect to backend**:
- Verify VITE_API_URL in frontend `.env`
- Check backend is running
- Verify CORS settings in backend
- Check browser console for errors

**Authentication fails**:
- Verify JWT_SECRET is set
- Check token is being stored in localStorage
- Verify token is sent in Authorization header
- Check token expiration settings

**File uploads fail**:
- Verify `uploads/` directory exists and is writable
- Check MAX_FILE_SIZE setting
- Verify file type is allowed
- Check disk space on server

**Database errors**:
- Verify schema is created correctly
- Check foreign key constraints
- Verify user permissions on database
- Check connection pool settings

## Support Files

### Example Page Migration (CustomersPage.tsx)

See `docs/migration-examples/CustomersPage-migrated.tsx` for complete example

### Environment Variables Reference

**Backend (.env)**:
```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=crm_database
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (.env)**:
```env
VITE_API_URL=https://api.yourdomain.com/api
```

## Security Checklist

- [ ] JWT_SECRET is strong and random
- [ ] MySQL password is strong
- [ ] HTTPS enabled in production
- [ ] CORS configured correctly
- [ ] File upload validation working
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection (helmet.js enabled)
- [ ] Rate limiting configured (optional)
- [ ] Environment variables not committed to git

## Maintenance

### Database Backups:
```bash
# Daily backup
mysqldump -u username -p crm_database > backup_$(date +%Y%m%d).sql
```

### Log Monitoring:
```bash
# View backend logs
pm2 logs crm-backend

# View error logs
tail -f /var/log/apache2/error.log
```

### Updates:
```bash
# Update dependencies
cd crm-mysql-backend
npm update

# Restart server
pm2 restart crm-backend
```

## Rollback Plan

If migration fails:

1. Keep original Supabase deployment running
2. Point DNS back to original deployment
3. Debug issues in staging environment
4. Re-attempt migration when resolved

## Timeline Estimate

- Backend Setup: 2-4 hours
- Frontend Update: 4-6 hours
- Testing: 2-3 hours
- Deployment: 1-2 hours
- **Total: 9-15 hours**

## Conclusion

This migration moves your CRM from Supabase to a self-hosted MySQL backend, giving you full control over your data and infrastructure. All existing features are preserved, and the user experience remains identical.

For questions or issues, refer to the troubleshooting section or contact support.
