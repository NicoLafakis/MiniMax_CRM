# Complete Deployment Package - CRM MySQL Migration

## Package Contents

This deployment package contains everything needed to run the CRM on MySQL backend with Node.js.

```
deployment-package/
├── crm-mysql-backend/          # Node.js/Express backend
│   ├── config/                 # Database configuration
│   ├── database/              # MySQL schema
│   ├── middleware/            # Authentication middleware
│   ├── routes/                # API endpoints
│   ├── server.js              # Main server file
│   ├── package.json           # Dependencies
│   ├── .env.example           # Environment template
│   └── README.md              # Backend documentation
│
├── crm-mysql-frontend/         # React frontend
│   ├── src/                   # Source code
│   │   ├── components/        # React components
│   │   ├── contexts/          # Context providers
│   │   ├── lib/              # API client
│   │   └── pages/            # Page components
│   ├── package.json           # Dependencies
│   ├── .env.example           # Environment template
│   └── vite.config.ts         # Build configuration
│
├── MIGRATION_GUIDE.md          # Step-by-step migration guide
├── DEPLOYMENT_GUIDE.md         # This file
└── README.md                   # Quick start guide
```

## Quick Start

### Prerequisites
- Node.js 16+ or 18+
- MySQL 8.0+
- Web hosting with Node.js support (Hostinger, VPS, etc.)
- Domain name (optional but recommended)

### Local Development Setup

1. **Clone or extract the deployment package**

2. **Setup Backend**:
```bash
cd crm-mysql-backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials
mysql -u root -p < database/schema.sql
npm run dev
```

3. **Setup Frontend**:
```bash
cd crm-mysql-frontend
pnpm install
cp .env.example .env
# Edit .env to point to backend (default: http://localhost:5000/api)
pnpm dev
```

4. **Access Application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000/api

## Production Deployment

### Option 1: Hostinger cPanel Hosting

#### Step 1: Prepare MySQL Database

1. Log into cPanel
2. Navigate to "MySQL Databases"
3. Create new database: `username_crm`
4. Create MySQL user with strong password
5. Grant ALL privileges to user on database
6. Open phpMyAdmin
7. Import `crm-mysql-backend/database/schema.sql`

#### Step 2: Deploy Backend

1. **Upload Files**:
   - Use File Manager or FTP
   - Upload `crm-mysql-backend/` to `~/crm-backend/`

2. **Configure Environment**:
   - Create `.env` file in `~/crm-backend/`:
   ```env
   PORT=5000
   NODE_ENV=production
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=username_crm_user
   DB_PASSWORD=your_strong_password
   DB_NAME=username_crm
   JWT_SECRET=generate_random_32_character_string
   JWT_EXPIRES_IN=7d
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./uploads
   CORS_ORIGIN=https://yourdomain.com
   ```

3. **Install Dependencies**:
   ```bash
   cd ~/crm-backend
   npm install --production
   ```

4. **Setup Node.js App** (via cPanel):
   - Open "Setup Node.js App"
   - Click "Create Application"
   - Node version: 18.x
   - Application mode: Production
   - Application root: crm-backend
   - Application URL: api.yourdomain.com (or subdirectory)
   - Application startup file: server.js
   - Click "Create"

5. **Setup PM2** (Alternative if cPanel doesn't have Node.js):
   ```bash
   npm install -g pm2
   cd ~/crm-backend
   pm2 start server.js --name crm-backend
   pm2 save
   pm2 startup
   ```

6. **Configure Reverse Proxy**:
   - In cPanel, create subdomain: `api.yourdomain.com`
   - Point to Node.js application port
   - Or use .htaccess redirect

#### Step 3: Deploy Frontend

1. **Build Frontend Locally**:
   ```bash
   cd crm-mysql-frontend
   # Update .env with production API URL
   echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
   pnpm install
   pnpm build
   ```

2. **Upload to Hosting**:
   - Upload contents of `dist/` folder to `public_html/`
   - Or to subdirectory like `public_html/crm/`

3. **Configure .htaccess**:
   Create `public_html/.htaccess`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteCond %{REQUEST_FILENAME} !-l
     RewriteRule . /index.html [L]
   </IfModule>

   # Security Headers
   <IfModule mod_headers.c>
     Header set X-Content-Type-Options "nosniff"
     Header set X-Frame-Options "SAMEORIGIN"
     Header set X-XSS-Protection "1; mode=block"
   </IfModule>

   # Gzip Compression
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
   </IfModule>
   ```

4. **Test Application**:
   - Visit https://yourdomain.com
   - Register new account
   - Test all features

### Option 2: VPS/Cloud Hosting (DigitalOcean, AWS, etc.)

#### Step 1: Server Setup

1. **Create Server**:
   - Ubuntu 22.04 LTS recommended
   - Minimum 2GB RAM, 2 vCPU
   - SSH access enabled

2. **Initial Server Configuration**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install MySQL
   sudo apt install -y mysql-server
   sudo mysql_secure_installation

   # Install Nginx
   sudo apt install -y nginx

   # Install PM2
   sudo npm install -g pm2

   # Install certbot for SSL
   sudo apt install -y certbot python3-certbot-nginx
   ```

3. **Create Application User**:
   ```bash
   sudo adduser crmapp
   sudo usermod -aG sudo crmapp
   su - crmapp
   ```

#### Step 2: Deploy Backend

1. **Upload Backend Files**:
   ```bash
   # On your local machine
   scp -r crm-mysql-backend crmapp@your-server-ip:~/

   # On server
   cd ~/crm-mysql-backend
   npm install --production
   ```

2. **Setup MySQL**:
   ```bash
   sudo mysql
   ```
   ```sql
   CREATE DATABASE crm_database;
   CREATE USER 'crmapp'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT ALL PRIVILEGES ON crm_database.* TO 'crmapp'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```
   ```bash
   mysql -u crmapp -p crm_database < database/schema.sql
   ```

3. **Configure Environment**:
   ```bash
   cd ~/crm-mysql-backend
   nano .env
   ```
   Add production values

4. **Start with PM2**:
   ```bash
   pm2 start server.js --name crm-backend
   pm2 save
   pm2 startup
   # Run the command that PM2 outputs
   ```

#### Step 3: Configure Nginx

1. **Backend API**:
   ```bash
   sudo nano /etc/nginx/sites-available/api.yourdomain.com
   ```
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

2. **Frontend**:
   ```bash
   sudo nano /etc/nginx/sites-available/yourdomain.com
   ```
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       root /var/www/crm-frontend;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Gzip compression
       gzip on;
       gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
   }
   ```

3. **Enable Sites**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
   sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Install SSL Certificates**:
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   sudo certbot --nginx -d api.yourdomain.com
   ```

#### Step 4: Deploy Frontend

1. **Build Frontend**:
   ```bash
   # On local machine
   cd crm-mysql-frontend
   echo "VITE_API_URL=https://api.yourdomain.com/api" > .env
   pnpm build
   ```

2. **Upload to Server**:
   ```bash
   scp -r dist/* crmapp@your-server-ip:/tmp/crm-frontend/
   ```

3. **Move to Web Root**:
   ```bash
   # On server
   sudo mkdir -p /var/www/crm-frontend
   sudo mv /tmp/crm-frontend/* /var/www/crm-frontend/
   sudo chown -R www-data:www-data /var/www/crm-frontend
   ```

### Option 3: Docker Deployment

#### Docker Compose Setup

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: crm_database
      MYSQL_USER: crmapp
      MYSQL_PASSWORD: password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./crm-mysql-backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "3306:3306"

  backend:
    build: ./crm-mysql-backend
    environment:
      PORT: 5000
      DB_HOST: mysql
      DB_USER: crmapp
      DB_PASSWORD: password
      DB_NAME: crm_database
      JWT_SECRET: your_jwt_secret
    ports:
      - "5000:5000"
    depends_on:
      - mysql
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./crm-mysql-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

Create `crm-mysql-backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

Create `crm-mysql-frontend/Dockerfile`:
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Deploy:
```bash
docker-compose up -d
```

## Post-Deployment Checklist

### Security
- [ ] HTTPS enabled
- [ ] Strong MySQL password
- [ ] Strong JWT secret (32+ characters)
- [ ] CORS configured correctly
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] SSH key authentication enabled
- [ ] Regular security updates scheduled
- [ ] Backup system configured

### Performance
- [ ] Gzip compression enabled
- [ ] Static asset caching configured
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] PM2 cluster mode enabled (if VPS)
- [ ] CDN configured (optional)

### Monitoring
- [ ] PM2 monitoring enabled
- [ ] Database backup script scheduled
- [ ] Error logging configured
- [ ] Uptime monitoring setup
- [ ] SSL certificate auto-renewal working

### Testing
- [ ] User registration works
- [ ] User login works
- [ ] All CRUD operations work
- [ ] File upload/download works
- [ ] Email notifications work (if implemented)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing complete
- [ ] Load testing performed

## Backup & Maintenance

### Daily Database Backup
```bash
# Create backup script
cat > ~/backup-crm.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u crmapp -ppassword crm_database > ~/backups/crm_$DATE.sql
# Keep only last 7 days
find ~/backups/ -name "crm_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup-crm.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * ~/backup-crm.sh
```

### Monitor Application
```bash
# View logs
pm2 logs crm-backend

# Monitor resources
pm2 monit

# Restart if needed
pm2 restart crm-backend
```

### Update Application
```bash
# Backend update
cd ~/crm-mysql-backend
git pull  # or upload new files
npm install --production
pm2 restart crm-backend

# Frontend update
cd ~/crm-mysql-frontend
pnpm build
sudo cp -r dist/* /var/www/crm-frontend/
```

## Troubleshooting

### Backend Issues

**Server won't start**:
```bash
pm2 logs crm-backend --lines 100
# Check for MySQL connection errors
# Verify .env configuration
```

**Database connection failed**:
```bash
mysql -u crmapp -p crm_database
# If fails, reset MySQL password
sudo mysql
ALTER USER 'crmapp'@'localhost' IDENTIFIED BY 'new_password';
```

### Frontend Issues

**API requests failing**:
- Check browser console for CORS errors
- Verify VITE_API_URL in built files
- Test API directly: `curl https://api.yourdomain.com/health`

**404 on page refresh**:
- Verify .htaccess or Nginx config
- Check React Router configuration

### Database Issues

**Slow queries**:
```sql
-- Check slow queries
SHOW PROCESSLIST;

-- Add indexes if needed
CREATE INDEX idx_customer_name ON customers(name);
```

## Support Resources

- Backend README: `crm-mysql-backend/README.md`
- Migration Guide: `MIGRATION_GUIDE.md`
- API Documentation: Backend server `/api` endpoints
- Frontend Documentation: Component documentation in code

## Scaling Considerations

### For Growing User Base (50-100 users):
- Upgrade server resources (4GB RAM, 4 vCPU)
- Enable PM2 cluster mode
- Configure Redis for session storage
- Implement API rate limiting

### For Large Deployments (100+ users):
- Separate database server
- Load balancer with multiple app servers
- CDN for static assets
- Database read replicas
- Implement caching layer (Redis)
- Consider microservices architecture

## Conclusion

Your CRM is now deployed on a self-hosted MySQL backend with full control over data and infrastructure. All features from the original Supabase version are preserved.

For issues or questions, refer to the troubleshooting section or contact support.
