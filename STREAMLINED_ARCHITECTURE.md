# 🎯 Streamlined Architecture - Direct Messaging & Email

## Overview

The iMessage application has been streamlined to focus on **Direct Messaging** and **Email** communication with real-time contact syncing. Groups and Channels have been removed to provide a cleaner, more focused user experience.

## Architecture

### Frontend Structure

```
Frontend (React + Zustand)
├── Messages Tab
│   ├── Direct Messages (DMs)
│   ├── Real-time delivery
│   └── Typing indicators
├── Emails Tab
│   ├── Inbox
│   ├── Sent
│   └── Drafts
└── Contacts Tab
    ├── Synced Contacts
    ├── Add Contact
    └── Invite Friends
```

### Backend Structure

```
Backend (Express + Socket.IO)
├── Authentication (Clerk)
│   └── Phone Number Required
├── Messages
│   └── Direct DM delivery
├── Emails
│   ├── Send/Receive
│   ├── Folders (Inbox, Sent, Drafts)
│   └── Real-time notifications
├── Contacts
│   ├── Phone sync (Android)
│   ├── VCF upload (Laptop)
│   ├── Manual entry
│   └── Smart matching
└── Web Sync
    ├── VCF file upload
    └── Manual bulk entry
```

## Key Features

### 1. Phone-Based Authentication

**Requirement**: Every user must provide a phone number during signup or immediately after login.

**Benefits**:
- Enables contact syncing
- Unique identifier for users
- SMS-ready for future features

**Implementation**:
- Clerk configured to require phone number
- Backend enforces phone number in webhook
- Frontend shows phone setup modal if missing

### 2. Contact Syncing (Multi-Platform)

#### Android Chrome
- Direct sync from device contacts
- Automatic matching
- Real-time updates

#### Laptop Web
- **VCF File Upload**: Export contacts from your computer and upload
- **Manual Entry**: Manually add phone numbers or emails in bulk

**Smart Matching**:
- Handles missing country codes
- Matches different formatting
- Fuzzy matching for edge cases

### 3. Direct Messaging

**Features**:
- Real-time message delivery
- Typing indicators
- Read receipts
- Offline message persistence
- Message search

**Flow**:
```
User A sends message
    ↓
Message saved to database
    ↓
Socket.IO emits to User B
    ↓
User B receives in real-time
    ↓
Confirmation sent back to User A
```

### 4. Email Integration

**Features**:
- Send/receive emails within the app
- Folder organization (Inbox, Sent, Drafts)
- Real-time notifications
- Email search

**Flow**:
```
User A sends email
    ↓
Email saved to "Sent" folder
    ↓
Email sent via SMTP/Resend
    ↓
Email saved to User B's "Inbox"
    ↓
Real-time notification to User B
```

## User Interface

### Sidebar Tabs

| Tab | Purpose | Content |
|-----|---------|---------|
| **Messages** | Direct messaging | List of active conversations |
| **Emails** | Email management | Inbox, Sent, Drafts folders |
| **Contacts** | Contact management | All synced contacts |

### Action Buttons

| Button | Action | Requirement |
|--------|--------|-------------|
| 🔄 Sync | Sync device/file contacts | Phone number required |
| ➕ Add | Add contact by phone/email | Phone number required |
| ✏️ New | Start new DM | Phone number required |

## Backend Endpoints

### Authentication
- `POST /api/auth/signup` - Register with phone number
- `POST /api/auth/login` - Login

### Messages
- `GET /api/messages/users` - Get all users
- `GET /api/messages/conversations` - Get active conversations
- `GET /api/messages/:userId` - Get messages with user
- `POST /api/messages/send/:userId` - Send message

### Emails
- `GET /api/emails?folder=inbox` - Get emails by folder
- `POST /api/emails/send` - Send email
- `POST /api/emails/draft` - Save draft

### Contacts
- `POST /api/contacts/sync` - Sync phone contacts (Android)
- `GET /api/contacts/check` - Check if phone/email registered
- `POST /api/contacts/invite` - Send invitation

### Web Sync (New)
- `GET /api/sync/status` - Check sync readiness
- `POST /api/sync/vcf` - Upload VCF file
- `POST /api/sync/manual` - Manual bulk entry

## Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  clerkId: String,
  email: String,
  fullName: String,
  phoneNumber: String, // E.164 format: +1234567890
  profilePic: String,
  bio: String,
  status: String, // "online" | "offline"
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  _id: ObjectId,
  senderId: ObjectId,
  receiverId: ObjectId,
  text: String,
  mediaUrl: String,
  status: String, // "sent" | "delivered" | "read"
  createdAt: Date,
  updatedAt: Date
}
```

### Email Model
```javascript
{
  _id: ObjectId,
  senderId: ObjectId,
  recipientEmail: String,
  subject: String,
  body: String,
  htmlBody: String,
  folder: String, // "inbox" | "sent" | "drafts"
  isRead: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

## Real-Time Features

### Socket.IO Events

**Connection**:
```javascript
socket.on('connect', () => {
  // User connected
});

socket.on('disconnect', () => {
  // User disconnected
});
```

**Messages**:
```javascript
socket.on('newMessage', (message) => {
  // Receive new message
});

socket.on('messageSent', (confirmation) => {
  // Message delivery confirmation
});

socket.on('typing', (data) => {
  // User is typing
});
```

**Emails**:
```javascript
socket.on('newEmail', (email) => {
  // Receive new email
});

socket.on('emailDelivered', (confirmation) => {
  // Email delivery confirmation
});
```

**Contacts**:
```javascript
socket.on('contactAdded', (contact) => {
  // New contact joined
});

socket.on('contactUpdated', (contact) => {
  // Contact updated profile
});
```

## Configuration

### Environment Variables

```bash
# Clerk Authentication
CLERK_WEBHOOK_SIGNING_SECRET=your_secret
VITE_CLERK_PUBLISHABLE_KEY=your_key

# Email Service (choose one)
RESEND_API_KEY=your_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

# OR

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/imessage

# Frontend
FRONTEND_URL=http://localhost:5173

# Server
PORT=3000
NODE_ENV=development
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
# Create .env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit with your credentials
```

### 3. Configure Clerk

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com)
2. Create application
3. Add phone number field (required)
4. Configure webhook to point to `http://localhost:3000/api/webhooks/clerk`
5. Copy credentials to `.env`

### 4. Configure Email Service

Choose one:

**Option A: Resend**
1. Go to [resend.com](https://resend.com)
2. Create account and API key
3. Add to `.env`: `RESEND_API_KEY=...`

**Option B: Gmail SMTP**
1. Enable 2FA on Gmail
2. Create app password
3. Add to `.env`: `SMTP_USER=...`, `SMTP_PASS=...`

### 5. Start Services

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 6. Test the App

1. Go to `http://localhost:5173`
2. Sign up with phone number
3. Sync contacts or add manually
4. Start messaging!

## Testing Scenarios

### Scenario 1: Complete Message Flow

1. Create 2 accounts with phone numbers
2. Sync contacts
3. Send message from Account A to Account B
4. Verify message appears in real-time on Account B

### Scenario 2: Email Delivery

1. Send email from Account A to Account B
2. Verify email appears in Account B's inbox
3. Verify real-time notification

### Scenario 3: Contact Sync (VCF)

1. Export contacts from your phone as VCF file
2. Upload VCF file in web app
3. Verify registered contacts appear
4. Verify unregistered contacts show invitation option

### Scenario 4: Manual Contact Entry

1. Manually enter phone numbers/emails
2. Verify registered contacts appear
3. Verify unregistered contacts show invitation option

## Troubleshooting

### Contacts not syncing
- Check phone numbers are in E.164 format (+1234567890)
- Verify both users have phone numbers set
- Check backend logs: `tail -f backend.log | grep CONTACT-SYNC`

### Emails not received
- Check email service is configured: `curl http://localhost:3000/api/health/email`
- Verify recipient email is correct
- Check spam folder
- Check backend logs: `tail -f backend.log | grep EMAIL`

### Messages not real-time
- Check Socket.IO connection in browser console
- Verify FRONTEND_URL is correct in backend `.env`
- Check CORS settings
- Restart backend

### Phone number not syncing
- Check Clerk webhook is configured
- Verify phone number is in E.164 format
- Check backend logs: `tail -f backend.log | grep CLERK-WEBHOOK`

## Performance Optimization

### Frontend
- Message pagination (load 50 at a time)
- Virtual scrolling for large lists
- Optimistic updates for instant UI feedback

### Backend
- Database indexing on frequently queried fields
- Connection pooling
- Caching for user lookups
- Rate limiting on API endpoints

## Security Considerations

1. **Authentication**: All endpoints protected by Clerk middleware
2. **Data Validation**: Input validation on all endpoints
3. **Rate Limiting**: Prevent abuse of contact sync and email endpoints
4. **CORS**: Configured to only allow FRONTEND_URL
5. **Email Verification**: Optional email verification for new users

## Future Enhancements

- [ ] SMS integration (Twilio)
- [ ] Voice/Video calls
- [ ] Message encryption
- [ ] File sharing
- [ ] Message reactions/emojis
- [ ] User blocking
- [ ] Message scheduling
- [ ] Auto-reply
- [ ] Email templates
- [ ] Mobile app (React Native)

## Support & Documentation

- [DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md) - Troubleshooting guide
- [EMAIL_SERVICE_SETUP.md](./EMAIL_SERVICE_SETUP.md) - Email configuration
- [PHONE_FIRST_ONBOARDING.md](./PHONE_FIRST_ONBOARDING.md) - Onboarding guide
- [REALTIME_WHATSAPP_FEATURES.md](./REALTIME_WHATSAPP_FEATURES.md) - Real-time features

---

**Last Updated**: June 18, 2026
**Status**: ✅ Production-Ready
