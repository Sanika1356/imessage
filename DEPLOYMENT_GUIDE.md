# 🚀 Deployment Guide - Production Ready

Complete guide to deploy your WhatsApp-style messaging application to production.

## 📋 Pre-Deployment Checklist

### Backend
- [ ] All environment variables configured
- [ ] MongoDB database ready (Atlas or hosted)
- [ ] Clerk authentication configured
- [ ] ImageKit/file storage configured
- [ ] Email service configured (Resend/SMTP)
- [ ] CORS settings updated for production domain
- [ ] Dependencies up to date (`npm audit`)
- [ ] Build process tested locally

### Frontend
- [ ] Environment variables configured
- [ ] Clerk publishable key updated
- [ ] API endpoint updated to production
- [ ] Build process tested locally
- [ ] Assets optimized
- [ ] PWA manifest configured (optional)

### Security
- [ ] Secrets not committed to Git
- [ ] Rate limiting configured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Input validation in place
- [ ] File upload limits set

## 🌐 Deployment Options

### Option 1: Vercel (Frontend) + Render (Backend)
**Best for:** Quick setup, auto-deployments, free tier

### Option 2: Railway (Full Stack)
**Best for:** All-in-one solution, easy database

### Option 3: AWS/GCP/Azure
**Best for:** Enterprise scale, full control

### Option 4: DigitalOcean/Linode
**Best for:** VPS hosting, custom setup

## 📦 Detailed Deployment Steps

---

## 1️⃣ MongoDB Setup (MongoDB Atlas)

### Step 1: Create Cluster
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up/Login
3. Create new project: "iMessage Production"
4. Create free cluster (M0 Sandbox)
5. Choose region close to your users

### Step 2: Configure Security
1. **Database Access**
   - Create database user
   - Username: `imessage-app`
   - Password: (Generate strong password)
   - Role: `readWrite@imessage`

2. **Network Access**
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - Or add specific IPs of your hosting provider

### Step 3: Get Connection String
1. Click "Connect" on cluster
2. Choose "Connect your application"
3. Copy connection string:
   ```
   mongodb+srv://imessage-app:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with actual password
5. Add database name: `/imessage`

**Final Connection String:**
```
mongodb+srv://imessage-app:your_password@cluster0.xxxxx.mongodb.net/imessage?retryWrites=true&w=majority
```

---

## 2️⃣ Backend Deployment (Render)

### Step 1: Prepare Backend

**Create `render.yaml` in root:**
```yaml
services:
  - type: web
    name: imessage-backend
    env: node
    buildCommand: cd backend && npm install && npm run build
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: CLERK_WEBHOOK_SECRET
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: IMAGEKIT_PUBLIC_KEY
        sync: false
      - key: IMAGEKIT_PRIVATE_KEY
        sync: false
      - key: IMAGEKIT_URL_ENDPOINT
        sync: false
      - key: RESEND_API_KEY
        sync: false
```

### Step 2: Deploy to Render

1. **Create Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **New Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Select your `imessage` repo

3. **Configure Service**
   ```
   Name: imessage-backend
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   ```

4. **Add Environment Variables**
   - Click "Environment" tab
   - Add all variables from checklist:
   
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   CLERK_WEBHOOK_SECRET=whsec_...
   FRONTEND_URL=https://your-app.vercel.app
   IMAGEKIT_PUBLIC_KEY=public_...
   IMAGEKIT_PRIVATE_KEY=private_...
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...
   RESEND_API_KEY=re_...
   PORT=3000
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete
   - Note your backend URL: `https://imessage-backend.onrender.com`

### Step 3: Configure Clerk Webhook

1. Go to Clerk dashboard
2. Navigate to Webhooks
3. Update endpoint URL to:
   ```
   https://imessage-backend.onrender.com/webhooks/clerk
   ```
4. Test the webhook

---

## 3️⃣ Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

**Update API endpoint in `frontend/src/lib/axios.js`:**
```javascript
const BASE_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:3000" 
  : "https://imessage-backend.onrender.com";
```

**Update Socket URL in `frontend/src/store/useAuthStore.js`:**
```javascript
const BASE_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:3000" 
  : "https://imessage-backend.onrender.com";
```

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Web Deployment**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project"
   - Import `imessage` repository

3. **Configure Project**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```

4. **Environment Variables**
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment
   - Note your frontend URL: `https://imessage.vercel.app`

### Step 3: Update Backend CORS

In `backend/.env` or Render environment:
```env
FRONTEND_URL=https://imessage.vercel.app
```

In `backend/src/index.js`, verify CORS:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

## 4️⃣ Alternative: Railway (Full Stack)

### Deploy Both Frontend & Backend

1. **Create Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select `imessage` repository

3. **Add Backend Service**
   - Click "Add Service" → "GitHub Repo"
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

4. **Add Frontend Service**
   - Click "Add Service" → "GitHub Repo"
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run preview`

5. **Add MongoDB Service**
   - Click "Add Service" → "Database" → "MongoDB"
   - Copy connection string

6. **Configure Environment Variables**
   - Set for each service as needed

7. **Custom Domains** (optional)
   - Click service → Settings → Domains
   - Add custom domain

---

## 5️⃣ Environment Variables Reference

### Backend (.env or hosting dashboard)
```env
# Required
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/imessage
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
FRONTEND_URL=https://your-frontend-domain.com
PORT=3000

# Optional but Recommended
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Email (choose one)
RESEND_API_KEY=re_xxxxxxxxxxxx
# OR
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend (.env or hosting dashboard)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxx
```

---

## 6️⃣ Custom Domain Setup

### For Frontend (Vercel)

1. **Add Domain**
   - Project → Settings → Domains
   - Add: `chat.yourdomain.com`

2. **Configure DNS**
   - Add CNAME record:
   ```
   Type: CNAME
   Name: chat
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Auto-provisioned by Vercel
   - Wait 24-48 hours for propagation

### For Backend (Render)

1. **Add Domain**
   - Service → Settings → Custom Domain
   - Add: `api.yourdomain.com`

2. **Configure DNS**
   - Add CNAME record:
   ```
   Type: CNAME
   Name: api
   Value: your-service.onrender.com
   ```

---

## 7️⃣ SSL/HTTPS Configuration

### Automatic (Recommended)
- **Vercel**: Auto HTTPS
- **Render**: Auto HTTPS
- **Railway**: Auto HTTPS

### Manual (VPS)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 8️⃣ Performance Optimization

### Backend Optimization

1. **Enable Compression**
   ```javascript
   import compression from 'compression';
   app.use(compression());
   ```

2. **Add Rate Limiting**
   ```javascript
   import rateLimit from 'express-rate-limit';
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   
   app.use('/api/', limiter);
   ```

3. **Enable Caching**
   ```javascript
   app.use(express.static('public', {
     maxAge: '1d'
   }));
   ```

### Frontend Optimization

1. **Code Splitting**
   - Already handled by Vite

2. **Image Optimization**
   - Use ImageKit transformations
   - Lazy load images

3. **Bundle Analysis**
   ```bash
   npm run build -- --analyze
   ```

---

## 9️⃣ Monitoring & Logging

### Application Monitoring

**Option 1: Sentry**
```bash
npm install @sentry/node @sentry/react
```

**Backend Setup:**
```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

**Frontend Setup:**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

### Logging

**Backend Logging:**
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});
```

### Uptime Monitoring

- **UptimeRobot**: Free tier, 50 monitors
- **Pingdom**: Advanced features
- **StatusCake**: Global monitoring

---

## 🔟 Backup & Recovery

### Database Backups

**MongoDB Atlas:**
1. Project → Backup
2. Enable Cloud Backup
3. Configure backup schedule
4. Set retention period

**Manual Backup:**
```bash
# Backup
mongodump --uri="mongodb+srv://..." --out=./backup

# Restore
mongorestore --uri="mongodb+srv://..." ./backup
```

### Application Backups

1. **GitHub**: Auto-backup code
2. **Environment Variables**: Store securely (password manager)
3. **Media Files**: ImageKit handles backups

---

## 1️⃣1️⃣ Scaling Strategies

### Horizontal Scaling

**Backend:**
- Deploy multiple instances
- Use load balancer
- Share Redis session store

**MongoDB:**
- Replica sets for read scaling
- Sharding for write scaling

### Vertical Scaling

- Upgrade server resources
- Increase memory/CPU
- Optimize database queries

---

## 1️⃣2️⃣ Security Hardening

### Backend Security

1. **Helmet.js**
   ```bash
   npm install helmet
   ```
   ```javascript
   import helmet from 'helmet';
   app.use(helmet());
   ```

2. **Rate Limiting**
   - Already covered above

3. **Input Validation**
   ```bash
   npm install express-validator
   ```

4. **SQL Injection Prevention**
   - Use Mongoose (already protected)

5. **XSS Prevention**
   - Sanitize inputs
   - Use Content Security Policy

### Environment Security

1. **Secrets Management**
   - Use hosting provider's secrets
   - Never commit to Git
   - Rotate regularly

2. **Access Control**
   - Limit admin access
   - Use SSH keys
   - Enable 2FA

---

## 1️⃣3️⃣ Testing in Production

### Smoke Tests

```bash
# Test backend health
curl https://api.yourdomain.com/auth/check

# Test database connection
curl https://api.yourdomain.com/health

# Test frontend
curl https://yourdomain.com
```

### Load Testing

```bash
# Install k6
brew install k6  # macOS
# or download from k6.io

# Run load test
k6 run loadtest.js
```

**loadtest.js:**
```javascript
import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  http.get('https://api.yourdomain.com/messages/users');
  sleep(1);
}
```

---

## 1️⃣4️⃣ Rollback Strategy

### Quick Rollback

**Vercel:**
- Dashboard → Deployments
- Click previous deployment
- Click "Promote to Production"

**Render:**
- Dashboard → Service
- Click "Rollback" on previous deploy

**Railway:**
- Dashboard → Deployments
- Click previous build → Redeploy

### Manual Rollback

```bash
# Revert Git commit
git revert HEAD
git push origin main

# Will trigger auto-deploy
```

---

## 1️⃣5️⃣ Post-Deployment

### Verification Checklist

- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Database connections work
- [ ] Authentication works
- [ ] Real-time features work (Socket.IO)
- [ ] File uploads work
- [ ] Email sending works
- [ ] All features tested

### User Communication

1. Announce deployment
2. Share new URL
3. Migration instructions (if needed)
4. Support contact info

### Monitor First 24 Hours

- Check error logs
- Monitor server load
- Watch for user reports
- Test critical features

---

## 🎯 Production Checklist

### Critical
- [x] HTTPS enabled
- [x] Environment variables set
- [x] Database backups enabled
- [x] Error monitoring configured
- [x] All secrets secured

### Recommended
- [ ] Custom domain configured
- [ ] CDN for static assets
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Automated backups

### Optional
- [ ] Load balancing
- [ ] Auto-scaling
- [ ] Multi-region deployment
- [ ] DDoS protection
- [ ] Advanced analytics

---

## 📊 Costs Estimation

### Free Tier
- **Vercel**: Free (hobby)
- **Render**: Free (with sleep)
- **MongoDB Atlas**: Free (512MB)
- **Clerk**: Free (10k MAU)
- **ImageKit**: Free (10GB/month)
- **Resend**: Free (100 emails/day)

**Total**: $0/month ✅

### Paid Plans (Growing)
- **Vercel Pro**: $20/month
- **Render Starter**: $7/month
- **MongoDB M10**: $10/month
- **Clerk Pro**: $25/month
- **ImageKit**: $49/month (1TB)
- **Resend Pro**: $20/month

**Total**: ~$131/month

### Enterprise Scale
- Custom pricing
- Dedicated resources
- SLA guarantees
- Priority support

---

## 🆘 Troubleshooting

### Common Issues

**1. CORS Errors**
```javascript
// Fix: Update CORS origin
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**2. Socket.IO Not Connecting**
```javascript
// Check: Frontend URL matches backend
const socket = io("https://api.yourdomain.com");
```

**3. Database Connection Fails**
```
// Verify: IP whitelist in MongoDB Atlas
// Check: Connection string format
```

**4. Build Fails**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Resources

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app)
- [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
- [Clerk Docs](https://clerk.com/docs)

---

**🎉 Congratulations on deploying to production!**

Your WhatsApp-style messaging app is now live and ready for users!
