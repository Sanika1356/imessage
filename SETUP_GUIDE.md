# 🚀 Quick Setup Guide

This guide will help you get the WhatsApp-style messaging application up and running in minutes.

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js (v16+) installed → [Download](https://nodejs.org/)
- ✅ MongoDB installed locally OR MongoDB Atlas account → [Atlas](https://www.mongodb.com/atlas)
- ✅ Git installed → [Download](https://git-scm.com/)

## Step-by-Step Setup

### 1️⃣ Database Setup

#### Option A: MongoDB Atlas (Recommended for beginners)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create free account
3. Create a new cluster (free tier available)
4. Click "Connect" → "Connect your application"
5. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

#### Option B: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```
3. Your connection string: `mongodb://localhost:27017/imessage`

### 2️⃣ Clerk Authentication Setup

1. **Create Clerk Account**
   - Go to [clerk.com](https://clerk.com)
   - Sign up for free account
   - Create new application

2. **Get Credentials**
   - Navigate to API Keys section
   - Copy "Publishable Key" (starts with `pk_`)
   - Copy "Secret Key" (starts with `sk_`)

3. **Configure Webhook**
   - Go to "Webhooks" in Clerk dashboard
   - Add endpoint: `http://localhost:3000/webhooks/clerk`
   - Select all events
   - Copy the "Signing Secret" (starts with `whsec_`)

### 3️⃣ Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd imessage

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4️⃣ Configure Environment Variables

#### Backend Configuration

Create `backend/.env`:

```env
# ===== REQUIRED =====
# MongoDB connection (from Step 1)
MONGODB_URI=mongodb://localhost:27017/imessage
# OR for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/imessage

# Clerk webhook secret (from Step 2)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# ===== OPTIONAL (for media uploads) =====
# Leave blank to skip - app works without these
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# ===== OPTIONAL (for external emails) =====
# Leave blank to skip - internal emails still work
RESEND_API_KEY=
```

#### Frontend Configuration

Create `frontend/.env`:

```env
# Clerk publishable key (from Step 2)
VITE_CLERK_PUBLISHABLE_KEY=pk_your_publishable_key_here
```

### 5️⃣ Start the Application

Open **TWO** terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

You should see:
```
Server is running on port 3000
MongoDB connected
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms
  
  ➜  Local:   http://localhost:5173/
```

### 6️⃣ Open the Application

1. Open browser
2. Navigate to: **http://localhost:5173**
3. Click "Sign Up" to create account
4. Start chatting! 🎉

## 🎯 Quick Test

After setup, try these features:

1. **Create Account**
   - Sign up with email or Google/GitHub
   - Complete profile

2. **Send First Message**
   - Click "+" to start new chat
   - Search for another user (if available)
   - Send "Hello!"

3. **Create Group**
   - Go to "Groups" tab
   - Click "Create Group"
   - Add name and members

4. **Try Voice Message**
   - Open any chat
   - Click microphone icon 🎤
   - Record and send!

## 🔧 Optional Enhancements

### Enable Media Uploads (ImageKit)

1. Go to [imagekit.io](https://imagekit.io)
2. Create free account (10GB/month free)
3. Get credentials from dashboard
4. Add to `backend/.env`:
   ```env
   IMAGEKIT_PUBLIC_KEY=public_xxx
   IMAGEKIT_PRIVATE_KEY=private_xxx
   IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
   ```
5. Restart backend

Now you can send images, videos, and voice messages!

### Enable External Emails (Resend)

1. Go to [resend.com](https://resend.com)
2. Create free account (100 emails/day free)
3. Get API key
4. Add to `backend/.env`:
   ```env
   RESEND_API_KEY=re_xxx
   ```
5. Restart backend

Now you can send emails to external addresses!

### Alternative: Gmail SMTP

If you prefer Gmail:

1. Enable 2-Step Verification in Google Account
2. Generate App Password
3. Add to `backend/.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=your_app_password
   ```
4. Restart backend

## ❓ Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
# Windows:
sc query MongoDB

# macOS/Linux:
ps aux | grep mongo

# Check if port 3000 is available
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux
```

### Frontend won't start
```bash
# Check if port 5173 is available
netstat -ano | findstr :5173  # Windows
lsof -i :5173                 # macOS/Linux

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Can't connect to MongoDB
```bash
# Test MongoDB connection
mongosh  # or mongo

# If fails, check if MongoDB service is running
# Restart MongoDB service (see Step 1)
```

### Clerk authentication not working
1. Check if webhook secret is correct
2. Verify publishable key in frontend
3. Ensure webhook endpoint is accessible
4. Check Clerk dashboard for webhook delivery status

### Images not uploading
- Verify ImageKit credentials are correct
- Check if all three values are set (public, private, endpoint)
- Restart backend after adding credentials
- Check browser console for errors

## 📝 Common Commands

```bash
# Backend
npm run dev          # Start development server
npm start            # Start production server
npm run db:seed      # Seed database with test users

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Both
npm install          # Install dependencies
npm update           # Update dependencies
```

## 🎓 Next Steps

Once running, check out:
- [Full README](./README.md) - Complete documentation
- [WhatsApp Features](./WHATSAPP_FEATURES.md) - Feature details
- API documentation in README
- Example code in components

## 💡 Tips

1. **Create Multiple Test Users**
   - Sign up with different emails
   - Or run seed command: `npm run db:seed`

2. **Test Groups**
   - Create groups with different settings
   - Make some public to test discovery

3. **Try Dark Mode**
   - Look for theme toggle in UI
   - Test WhatsApp-style appearance

4. **Explore Email Features**
   - Switch to "Emails" tab
   - Send internal emails between users

## 🆘 Still Having Issues?

1. Check error messages in:
   - Backend terminal
   - Frontend terminal
   - Browser console (F12)

2. Verify all environment variables are set

3. Ensure all services are running:
   - MongoDB
   - Backend (port 3000)
   - Frontend (port 5173)

4. Try clean restart:
   ```bash
   # Stop both servers (Ctrl+C)
   # Clear node_modules
   rm -rf node_modules
   npm install
   # Start again
   ```

## ✅ Success Checklist

- [ ] MongoDB connected
- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] Can access http://localhost:5173
- [ ] Can sign up/login with Clerk
- [ ] Can send text messages
- [ ] Can create groups
- [ ] Real-time features work (typing indicators, etc.)

---

**🎉 Congratulations! Your WhatsApp-style app is ready!**

Need more help? Check the [full documentation](./README.md) or open an issue on GitHub.
