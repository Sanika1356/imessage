# 📱 WhatsApp-Style Messaging Application

A full-featured messaging application inspired by WhatsApp, built with modern web technologies. Features real-time messaging, voice messages, group chats, email integration, and much more!

![Version](https://img.shields.io/badge/version-2.0.0-green)
![License](https://img.shields.io/badge/license-ISC-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)
![React](https://img.shields.io/badge/react-19.2.6-blue)

## ✨ Key Features

### 💬 Messaging
- ✅ **Real-time Text Messaging** - Instant message delivery with Socket.IO
- ✅ **Voice Messages** 🎤 - Record and send audio messages
- ✅ **Media Sharing** - Images, videos, and PDF files
- ✅ **Message Reactions** - React with emojis (👍 ❤️ 😂 😮 😢 🙏)
- ✅ **Reply to Messages** - Quote and reply to specific messages
- ✅ **Message Status** - Sent, Delivered, Read indicators (WhatsApp-style checkmarks)
- ✅ **Typing Indicators** - See when others are typing
- ✅ **Online Status** - Green dot for online users

### 👥 Groups & Channels
- ✅ **Group Chats** - Create and manage group conversations
- ✅ **Public Group Discovery** - Browse and join public groups
- ✅ **Invite Links** - Share group invite links
- ✅ **Admin Controls** - Manage group permissions and members
- ✅ **Broadcast Channels** - One-to-many communication channels
- ✅ **Telegram Integration** - Bridge with Telegram groups/channels

### 📧 Email Features
- ✅ **Send/Receive Emails** - Full SMTP integration
- ✅ **Internal Messaging** - Email-like messaging between app users
- ✅ **Attachments** - Send files via email
- ✅ **Folders** - Inbox, Sent, Draft, Trash organization
- ✅ **CC/BCC Support** - Multiple recipients

### 🎨 UI/UX
- ✅ **WhatsApp-Inspired Design** - Green color scheme and familiar interface
- ✅ **Dark Mode** - Complete dark theme support
- ✅ **Responsive Design** - Works on mobile, tablet, and desktop
- ✅ **Custom Wallpapers** - Personalize chat backgrounds
- ✅ **Keyboard Sounds** - Optional typing sound effects

## 🏗️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: Clerk
- **Email**: Nodemailer + Resend API
- **File Storage**: ImageKit (images, videos, audio)
- **Scheduling**: node-cron

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Library**: HeroUI + Tailwind CSS
- **Routing**: React Router v7
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Clerk account (for authentication)
- Optional: ImageKit account (for media uploads)
- Optional: Resend API key (for external emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd imessage
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

#### Backend Environment Variables

Create `backend/.env`:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/imessage
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
FRONTEND_URL=http://localhost:5173

# Optional - Media Upload (ImageKit)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

# Optional - Email (Resend)
RESEND_API_KEY=your_resend_api_key

# Optional - Email (SMTP Fallback)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

#### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📖 Usage Guide

### Creating an Account
1. Visit http://localhost:5173
2. Click "Sign Up" and follow Clerk's authentication flow
3. Complete your profile setup

### Sending Messages
1. Click the "+" button or search for a user
2. Type your message in the input field
3. Press Enter or click Send

### Voice Messages
1. Click the microphone icon 🎤
2. Record your message
3. Click send or cancel to discard

### Creating Groups
1. Go to the "Groups" tab
2. Click "Create Group"
3. Add members and group details
4. Click "Create"

### Joining Public Groups
1. Go to the "Groups" tab
2. Click "Discover Public Groups"
3. Browse or search for groups
4. Click "Join" to join instantly

### Sending Emails
1. Switch to the "Emails" tab
2. Click "Compose"
3. Fill in recipients, subject, and body
4. Attach files if needed
5. Click "Send" or "Save Draft"

## 🔧 Configuration

### ImageKit Setup (Optional but Recommended)
1. Create account at [imagekit.io](https://imagekit.io)
2. Get your Public Key, Private Key, and URL Endpoint
3. Add to `backend/.env`

### Email Setup (Optional)
For external email sending, either:

**Option 1: Resend (Recommended)**
1. Create account at [resend.com](https://resend.com)
2. Get API key
3. Add `RESEND_API_KEY` to `backend/.env`

**Option 2: SMTP (Gmail example)**
1. Enable 2-Step Verification on Gmail
2. Generate App Password
3. Add SMTP credentials to `backend/.env`

### Clerk Setup
1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Get Publishable Key for frontend
4. Get Webhook Secret for backend
5. Configure webhook endpoint: `http://your-backend-url/webhooks/clerk`

## 📁 Project Structure

```
imessage/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   ├── lib/              # Utilities (socket, db, etc.)
    │   │   ├── middleware/       # Express middleware
    │   │   └── webhooks/         # Webhook handlers
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Zustand stores
│   │   ├── lib/              # Utilities
│   │   ├── context/          # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── styles/           # CSS files
│   ├── public/               # Static assets
│   ├── package.json
│   └── .env
├── WHATSAPP_FEATURES.md      # Detailed feature documentation
└── README.md                 # This file
```

## 🔌 API Endpoints

### Authentication
- `GET /auth/check` - Check authentication status

### Messages
- `GET /messages/users` - Get all users
- `GET /messages/conversations` - Get user's conversations
- `GET /messages/:userId` - Get messages with a user
- `POST /messages/send/:userId` - Send message to user
- `GET /messages/search?query=...` - Search users

### Groups
- `GET /groups` - Get user's groups
- `GET /groups/public` - Get public groups
- `POST /groups/create` - Create new group
- `POST /groups/join` - Join group by invite code
- `GET /groups/:id` - Get group messages
- `POST /groups/send/:id` - Send message to group
- `POST /groups/messages/:messageId/reactions` - Add/remove reaction

### Channels
- `GET /channels` - Get user's channels
- `POST /channels/create` - Create new channel
- `POST /channels/subscribe` - Subscribe to channel
- `GET /channels/:id` - Get channel posts
- `POST /channels/send/:id` - Post to channel
- `POST /channels/pin` - Pin a post

### Emails
- `GET /emails?folder=inbox` - Get emails by folder
- `POST /emails/send` - Send email
- `POST /emails/draft` - Save draft
- `PUT /emails/:id` - Update email status

## 🎯 Key Features in Detail

### Real-Time Communication
The app uses Socket.IO for real-time features:
- Instant message delivery
- Live typing indicators
- Online/offline status updates
- Read receipts
- Message reactions

### Message Status Indicators
- ✓ Single check - Sent
- ✓✓ Double check - Delivered
- 💙✓✓ Blue double check - Read

### Group Permissions
Groups can be configured with:
- Public/Private visibility
- Admin-only messaging
- Admin-only info editing
- Member invitation permissions

## 🔐 Security

- Authentication via Clerk (OAuth, MFA support)
- Protected API routes with JWT validation
- Input validation and sanitization
- CORS protection
- Secure file uploads
- Environment variable protection

## 🐛 Troubleshooting

### Common Issues

**Socket connection fails:**
- Check if backend is running
- Verify CORS settings in backend
- Ensure FRONTEND_URL is correct in backend .env

**Images/Videos not uploading:**
- Verify ImageKit credentials
- Check file size limits
- Ensure IMAGEKIT_URL_ENDPOINT is correct

**Emails not sending:**
- Check RESEND_API_KEY or SMTP credentials
- Verify email addresses are valid
- Check backend logs for errors

**Clerk authentication issues:**
- Verify CLERK_WEBHOOK_SECRET matches Clerk dashboard
- Check webhook endpoint is accessible
- Ensure Publishable Key is correct

## 📚 Additional Documentation

- [WhatsApp Features Guide](./WHATSAPP_FEATURES.md) - Detailed feature documentation
- [Backend API Documentation](#api-endpoints)
- [Contributing Guidelines](#contributing)

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👏 Acknowledgments

- WhatsApp for design inspiration
- Clerk for authentication
- ImageKit for media storage
- The open-source community

## 📧 Support

For support, please:
- Open an issue on GitHub
- Check the documentation
- Review existing issues

## 🗺️ Roadmap

### Upcoming Features
- [ ] Voice/Video calls (WebRTC)
- [ ] Stories/Status updates
- [ ] Message forwarding UI
- [ ] Message search
- [ ] Media gallery view
- [ ] Starred messages
- [ ] Poll creation in groups
- [ ] Location sharing
- [ ] Push notifications
- [ ] End-to-end encryption

---

**Made with ❤️ by [Your Name]**

**Tech Stack**: Node.js · Express · MongoDB · React · Socket.IO · Tailwind CSS
