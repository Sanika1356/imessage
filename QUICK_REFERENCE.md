# 🚀 Quick Reference Card

Fast reference for common tasks and code snippets.

## 📦 Installation Commands

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend  
cd frontend && npm install && npm run dev

# Both (from root)
npm install --prefix backend && npm install --prefix frontend
```

## 🔑 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/imessage
CLERK_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=http://localhost:5173
IMAGEKIT_PUBLIC_KEY=public_xxx
IMAGEKIT_PRIVATE_KEY=private_xxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxx
RESEND_API_KEY=re_xxx
```

### Frontend (.env)
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

## 🌐 URLs

| Service | Development | Production |
|---------|-------------|------------|
| Frontend | http://localhost:5173 | your-app.vercel.app |
| Backend | http://localhost:3000 | your-api.render.com |
| MongoDB | localhost:27017 | MongoDB Atlas |

## 📡 API Endpoints Quick Reference

### Messages
```
GET    /messages/users              # Get all users
GET    /messages/conversations      # Get conversations  
GET    /messages/:userId            # Get DM messages
POST   /messages/send/:userId       # Send DM message
GET    /messages/search?query=      # Search users
```

### Groups
```
GET    /groups                      # My groups
GET    /groups/public               # Public groups
POST   /groups/create               # Create group
POST   /groups/join                 # Join group
GET    /groups/:id                  # Group messages
POST   /groups/send/:id             # Send to group
POST   /groups/messages/:id/reactions # Add reaction
```

### Channels
```
GET    /channels                    # My channels
POST   /channels/create             # Create channel
POST   /channels/subscribe          # Subscribe
GET    /channels/:id                # Channel posts
POST   /channels/send/:id           # Post to channel
POST   /channels/pin                # Pin post
```

### Emails
```
GET    /emails?folder=inbox         # Get emails
POST   /emails/send                 # Send email
POST   /emails/draft                # Save draft
PUT    /emails/:id                  # Update email
```

## 💻 Code Snippets

### Send Message (Frontend)
```javascript
import { useChatStore } from './store/useChatStore';

const sendMessage = useChatStore((state) => state.sendMessage);

// Send text
await sendMessage({ text: "Hello!" });

// Send with reply
await sendMessage({ 
  text: "Reply", 
  replyTo: messageId 
});
```

### Send Voice Message
```javascript
const sendVoiceMessage = useChatStore((state) => state.sendVoiceMessage);

// audioBlob from VoiceRecorder component
await sendVoiceMessage(conversationId, audioBlob);
```

### Add Reaction
```javascript
const addReaction = useChatStore((state) => state.addReaction);

await addReaction(messageId, "👍");
```

### Create Group
```javascript
const createGroup = useChatStore((state) => state.createGroup);

await createGroup({
  name: "Tech Team",
  description: "Developers unite!",
  members: [userId1, userId2],
  isPublic: true,
  groupPhoto: "url"
});
```

### Get Public Groups
```javascript
const getPublicGroups = useChatStore((state) => state.getPublicGroups);

const groups = await getPublicGroups();
```

### Socket Events (Backend)
```javascript
// Emit to specific user
io.to(socketId).emit("newMessage", message);

// Emit to all online users
io.emit("getOnlineUsers", userIds);

// Listen to client event
socket.on("typing:start", (data) => {
  // Handle typing
});
```

### Database Query Examples
```javascript
// Find messages between two users
const messages = await Message.find({
  $or: [
    { senderId: user1, receiverId: user2 },
    { senderId: user2, receiverId: user1 }
  ]
}).sort({ createdAt: 1 });

// Find user's groups
const groups = await Group.find({
  members: userId
}).populate("members owner");

// Add reaction to message
await Message.findByIdAndUpdate(
  messageId,
  { $push: { reactions: { userId, emoji } } }
);
```

## 🎨 Styling Classes

### WhatsApp Theme Classes
```css
/* Message bubbles */
.whatsapp-message-sent       /* Your messages */
.whatsapp-message-received   /* Their messages */

/* UI Elements */
.whatsapp-header            /* Green header */
.whatsapp-sidebar           /* Sidebar */
.whatsapp-chat-bg           /* Chat background */
.whatsapp-btn-primary       /* Green buttons */
.whatsapp-input             /* Input fields */

/* Status */
.whatsapp-status-sent       /* Gray check */
.whatsapp-status-delivered  /* Gray double check */
.whatsapp-status-read       /* Blue double check */

/* Components */
.whatsapp-chat-item         /* Chat list item */
.whatsapp-timestamp         /* Time display */
.whatsapp-unread-badge      /* Unread count */
.whatsapp-online-indicator  /* Green dot */
```

### Tailwind Utilities
```html
<!-- WhatsApp Green -->
<div class="bg-[#25D366]">
<div class="text-[#25D366]">

<!-- Dark Mode -->
<div class="bg-white dark:bg-[#0B141A]">

<!-- Message Bubble -->
<div class="max-w-[65%] rounded-lg p-2 shadow">
```

## 🔧 Common Commands

### Development
```bash
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production
npm run db:seed         # Seed database
```

### Debugging
```bash
# Backend logs
tail -f backend/logs/error.log

# Check MongoDB
mongosh
use imessage
db.users.find()
db.messages.find()

# Check ports
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux
```

### Git
```bash
git status
git add .
git commit -m "feat: add feature"
git push origin main
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port
npx kill-port 3000
npx kill-port 5173
```

### MongoDB Not Connected
```bash
# Check MongoDB service
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Clerk Webhook Failing
```
1. Check CLERK_WEBHOOK_SECRET
2. Verify endpoint: /webhooks/clerk
3. Check webhook logs in Clerk dashboard
4. Ensure webhook events are selected
```

### Socket.IO Not Connecting
```javascript
// Frontend - check CORS
const socket = io("http://localhost:3000", {
  transports: ['websocket', 'polling']
});

// Backend - check CORS
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
```

### Images Not Uploading
```
1. Verify ImageKit credentials
2. Check file size (max 10MB)
3. Ensure correct file types
4. Check network/firewall
```

## 📱 Component Import Paths

```javascript
// Chat Components
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { PublicGroupsModal } from '@/components/chat/PublicGroupsModal';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { ChatComposer } from '@/components/chat/ChatComposer';

// Store
import { useChatStore } from '@/store/useChatStore';
import { useAuthStore } from '@/store/useAuthStore';

// Utils
import { axiosInstance } from '@/lib/axios';
```

## 🎯 Feature Flags

```javascript
// Enable/disable features
const FEATURES = {
  VOICE_MESSAGES: true,
  REACTIONS: true,
  PUBLIC_GROUPS: true,
  EMAIL: true,
  DARK_MODE: true,
};

// Use in components
{FEATURES.VOICE_MESSAGES && <VoiceRecorder />}
```

## 📊 Database Schema Quick Reference

### User
```javascript
{
  clerkId: String,
  fullName: String,
  email: String,
  profilePic: String,
  phoneNumber: String,
  bio: String,
  status: String, // online/offline
  lastSeen: Date
}
```

### Message
```javascript
{
  senderId: ObjectId,
  receiverId: ObjectId,
  groupId: ObjectId,
  text: String,
  image: String,
  video: String,
  audio: String,
  replyTo: ObjectId,
  reactions: [{ userId, emoji }],
  status: String, // sent/delivered/read
  edited: Boolean,
  deleted: Boolean
}
```

### Group
```javascript
{
  name: String,
  description: String,
  groupPhoto: String,
  owner: ObjectId,
  admins: [ObjectId],
  members: [ObjectId],
  inviteCode: String,
  inviteLink: String,
  isPublic: Boolean,
  settings: {
    onlyAdminsCanSend: Boolean,
    onlyAdminsCanEditInfo: Boolean,
    membersCanAddOthers: Boolean
  }
}
```

## 🚀 Deployment Quick Commands

### Vercel (Frontend)
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Render (Backend)
```bash
# Push to GitHub
git add .
git commit -m "deploy"
git push origin main

# Auto-deploys if connected
```

## 🔐 Security Checklist

```
□ Environment variables in .env (not .env.example)
□ .env in .gitignore
□ HTTPS enabled in production
□ CORS configured for production domain
□ Rate limiting enabled
□ Input validation on all endpoints
□ File upload size limits
□ Secrets not in code
```

## 📞 Emergency Commands

```bash
# Kill all Node processes
pkill node  # macOS/Linux
taskkill /F /IM node.exe  # Windows

# Clean install
rm -rf node_modules package-lock.json
npm install

# Reset database
mongosh
use imessage
db.dropDatabase()

# Clear browser cache
Ctrl+Shift+Delete (Chrome)
Cmd+Shift+Delete (Safari)
```

## 📚 Documentation Links

- [Full README](./README.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Feature Details](./WHATSAPP_FEATURES.md)
- [Visual Guide](./FEATURES_GUIDE.md)
- [Deployment](./DEPLOYMENT_GUIDE.md)

## 💡 Pro Tips

1. **Use VS Code Extensions**
   - ES7+ React snippets
   - Tailwind CSS IntelliSense
   - MongoDB for VS Code
   - Thunder Client (API testing)

2. **Browser DevTools**
   - F12 → Network tab (API calls)
   - F12 → Console (errors)
   - F12 → Application → Local Storage (Zustand)
   - F12 → WebSocket frames (Socket.IO)

3. **Testing Tips**
   - Test with 2+ browser windows (different users)
   - Use incognito for second user
   - Check MongoDB Compass for data
   - Use Postman/Thunder for API testing

4. **Performance**
   - React DevTools Profiler
   - Lighthouse audit
   - Network throttling test
   - Mobile device testing

---

**🎉 Keep this handy while developing!**

Print or bookmark for quick access to common patterns and commands.
