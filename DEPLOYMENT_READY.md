# Production Deployment Guide - MiniMax CRM

## 📦 Build Complete!

Your application has been successfully built for production deployment.

## 📂 What Was Built

### Frontend (crm-mysql-frontend/dist/)
- **Location**: `crm-mysql-frontend/dist/`
- **Size**: ~520 KB (minified & gzipped to ~100 KB)
- **Files**:
  - `index.html` - Main HTML file
  - `assets/` - CSS and JavaScript bundles

### Backend (crm-mysql-backend/)
- **Location**: `crm-mysql-backend/`
- **Ready for deployment** with all necessary files

---

## 🚀 Deployment Options

### Option 1: Deploy to cPanel/Hostinger (Recommended for your setup)

#### A. Deploy Backend

1. **Upload Backend Files** via FTP or File Manager:
   ```
   Upload these files from crm-mysql-backend/:
   ├── server.js
   ├── package.json
   ├── .env.production (rename to .env on server)
   ├── config/
   ├── middleware/
   ├── routes/
   └── database/
   ```

2. **Install Dependencies** via SSH or Terminal:
   ```bash
   cd /path/to/backend
   npm install --production
   ```

3. **Update .env** on server:
   ```bash
   # Edit .env file
   PORT=5000
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

4. **Start Backend** using PM2 or Node:
   ```bash
   # With PM2 (recommended)
   pm2 start server.js --name crm-backend
   pm2 save
   pm2 startup
   
   # Or with Node
   node server.js &
   ```

5. **Set up as a Service** (if available):
   - Use cPanel Node.js app manager
   - Or set up PM2 to run on startup

#### B. Deploy Frontend

1. **Upload Frontend Files**:
   ```
   Upload all files from crm-mysql-frontend/dist/ to your web root:
   - public_html/
   - or public_html/crm/
   - or htdocs/
   ```

2. **Configure Web Server**:
   
   Create `.htaccess` in the same directory:
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

3. **Update API URL** (if needed):
   - The frontend was built with `VITE_API_URL=http://localhost:5000/api`
   - If your backend is on a different domain, rebuild with:
     ```bash
     cd crm-mysql-frontend
     echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
     npm run build
     ```

---

### Option 2: Deploy to VPS (DigitalOcean, AWS, etc.)

#### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### Step 2: Deploy Backend

```bash
# Upload files to server
scp -r crm-mysql-backend/ user@server:/var/www/crm-backend/

# SSH into server
ssh user@server

# Navigate and install
cd /var/www/crm-backend
npm install --production

# Copy production env
cp .env.production .env
nano .env  # Update settings

# Start with PM2
pm2 start server.js --name crm-backend
pm2 save
pm2 startup
```

#### Step 3: Deploy Frontend

```bash
# Upload dist files
scp -r crm-mysql-frontend/dist/* user@server:/var/www/crm-frontend/

# Configure Nginx
sudo nano /etc/nginx/sites-available/crm
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/crm-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 4: Setup SSL (Optional but Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value (32+ characters)
- [ ] Update `CORS_ORIGIN` to your actual frontend domain
- [ ] Set `NODE_ENV=production` in backend .env
- [ ] Enable HTTPS/SSL for both frontend and backend
- [ ] Ensure database credentials are secure
- [ ] Set up firewall rules (allow only necessary ports)
- [ ] Configure rate limiting on backend API
- [ ] Regular backups of database
- [ ] Monitor server logs

---

## 📝 Post-Deployment Tasks

### 1. Create First User

After deployment, create an admin user by calling the registration endpoint:

```bash
curl -X POST https://your-backend-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "YourSecurePassword123!",
    "full_name": "Admin User"
  }'
```

### 2. Test the Application

1. Visit your frontend URL
2. Login with the created account
3. Test all features:
   - Create a customer
   - Create a deal
   - Create a ticket
   - Upload an attachment
   - Log an activity

### 3. Monitor

```bash
# Check backend logs
pm2 logs crm-backend

# Check backend status
pm2 status

# Check Nginx logs (if using Nginx)
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🛠️ Troubleshooting

### Frontend can't connect to backend

**Check:**
- Backend is running (`pm2 status` or `ps aux | grep node`)
- CORS is configured correctly in backend .env
- API URL is correct in frontend
- Firewall allows traffic on backend port

**Fix:**
```bash
# Rebuild frontend with correct API URL
cd crm-mysql-frontend
echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
npm run build
# Re-upload dist/ folder
```

### Backend not connecting to database

**Check:**
- Database credentials in .env
- Database server is accessible from your server
- Port 3306 is open (if remote MySQL)

**Test connection:**
```bash
mysql -h 193.203.166.21 -u u446811592_freecrm -p u446811592_freecrm
```

### PM2 process crashes

**Check logs:**
```bash
pm2 logs crm-backend --lines 100
```

**Common issues:**
- Port already in use (change PORT in .env)
- Missing dependencies (run `npm install`)
- Database connection failed (check credentials)

---

## 📊 File Structure After Deployment

```
Your Server:
├── /var/www/crm-frontend/          # Frontend files
│   ├── index.html
│   └── assets/
│       ├── index-[hash].css
│       └── index-[hash].js
│
├── /var/www/crm-backend/           # Backend files
│   ├── server.js
│   ├── package.json
│   ├── .env                        # Production config
│   ├── uploads/                    # File uploads
│   ├── config/
│   ├── middleware/
│   └── routes/
│
└── Database: 193.203.166.21        # Remote MySQL
```

---

## 🔄 Updating the Application

### Update Frontend

```bash
# Local machine
cd crm-mysql-frontend
npm run build

# Upload new dist/ folder to server
scp -r dist/* user@server:/var/www/crm-frontend/
```

### Update Backend

```bash
# Upload changed files
scp -r crm-mysql-backend/* user@server:/var/www/crm-backend/

# Restart backend
pm2 restart crm-backend
```

---

## 📞 Quick Commands Reference

```bash
# Backend Management
pm2 start server.js --name crm-backend
pm2 stop crm-backend
pm2 restart crm-backend
pm2 logs crm-backend
pm2 delete crm-backend

# Check processes
pm2 status
pm2 monit

# Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t  # Test configuration

# Database
mysql -h 193.203.166.21 -u u446811592_freecrm -p
```

---

## ✅ Your Build Summary

- **Frontend Build**: ✅ Complete
  - Location: `crm-mysql-frontend/dist/`
  - Size: 518.95 kB (minified)
  
- **Backend Ready**: ✅ Ready for deployment
  - Entry point: `server.js`
  - Database: Already configured (193.203.166.21)

- **Environment Files**: ✅ Created
  - Backend production env: `.env.production`
  - Update domains and secrets before deploying!

---

## 🎉 You're Ready to Deploy!

Follow the steps for your chosen hosting platform above. If you need help with a specific deployment scenario, let me know!
