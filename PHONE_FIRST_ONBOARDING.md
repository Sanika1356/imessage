# 📱 Phone-First Onboarding Implementation Guide

## Overview

This guide explains how to implement a phone-first onboarding experience similar to WhatsApp, where users must provide a phone number during signup or immediately after login.

## Current Flow

Currently, the application:
1. Uses Clerk for authentication
2. Allows signup without phone number
3. Prompts for phone number after login (optional)
4. Phone syncing is manual via "Sync Contacts" button

## Desired Flow (WhatsApp-like)

1. User signs up with phone number
2. Phone number is automatically synced from Clerk
3. Contacts are automatically synced
4. User can immediately start messaging

## Implementation Steps

### Step 1: Configure Clerk to Require Phone Number

1. **Go to Clerk Dashboard**
   - Login to [dashboard.clerk.com](https://dashboard.clerk.com)
   - Select your application

2. **Configure Sign-Up**
   - Go to "User & Authentication" → "Sign-up & Sign-in"
   - Click "Edit" next to Sign-up
   - Add "Phone Number" field
   - Mark as "Required"
   - Save

3. **Verify in Frontend**
   - The Clerk sign-up form will now require phone number
   - Phone number will be automatically synced via webhook

### Step 2: Verify Webhook is Receiving Phone Numbers

1. **Check Backend Logs**
   ```bash
   # Start backend
   npm run dev

   # Watch for webhook logs
   tail -f backend.log | grep CLERK-WEBHOOK
   ```

2. **Create Test Account**
   - Go to your app's sign-up page
   - Sign up with:
     - Email: test@example.com
     - Phone: +1234567890
     - Name: Test User

3. **Verify Logs**
   - You should see:
   ```
   [CLERK-WEBHOOK] Normalized phone: +1234567890
   [CLERK-WEBHOOK] User synced - Email: test@example.com, Phone: +1234567890
   ```

### Step 3: Auto-Sync Contacts After Login

Edit `frontend/src/components/chat/ChatSidebar.jsx`:

```javascript
// Add this useEffect after component mounts
useEffect(() => {
  const autoSyncContacts = async () => {
    const { authUser } = useAuthStore.getState();
    
    if (authUser?.phoneNumber) {
      console.log('[AUTO-SYNC] Phone number found, attempting auto-sync');
      
      // Check if contacts were already synced
      const lastSync = localStorage.getItem('lastContactSync');
      const now = Date.now();
      
      // Only sync once per hour
      if (!lastSync || (now - parseInt(lastSync)) > 3600000) {
        try {
          // Trigger contact sync
          await syncContacts();
          localStorage.setItem('lastContactSync', now.toString());
          console.log('[AUTO-SYNC] Contacts synced successfully');
        } catch (error) {
          console.error('[AUTO-SYNC] Failed to sync contacts:', error);
        }
      }
    } else {
      console.log('[AUTO-SYNC] No phone number, skipping auto-sync');
    }
  };

  autoSyncContacts();
}, []);
```

### Step 4: Enforce Phone Number on First Login

Edit `frontend/src/components/chat/ChatSidebar.jsx`:

```javascript
// Add this useEffect to enforce phone number
useEffect(() => {
  const enforcePhoneNumber = async () => {
    const { authUser } = useAuthStore.getState();
    
    if (!authUser?.phoneNumber) {
      console.log('[ENFORCE] No phone number, showing setup modal');
      
      // Show phone setup modal
      setShowPhoneSetup(true);
    }
  };

  enforcePhoneNumber();
}, [authUser]);
```

### Step 5: Update Frontend Components

#### PhoneNumberSetup.jsx

Make sure this component:
1. Shows a clear message: "Add your phone number to sync contacts"
2. Accepts phone number input
3. Calls `updatePhoneNumber()` API
4. Shows success message
5. Auto-syncs contacts after phone is added

```javascript
// Example implementation
export function PhoneNumberSetup() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePhoneNumber } = useContactStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updatePhoneNumber(phone);
      toast.success('Phone number saved! Syncing contacts...');
      
      // Auto-sync contacts
      await syncContacts();
      
      // Close modal
      setShowPhoneSetup(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="phone-setup-modal">
      <h2>Add Your Phone Number</h2>
      <p>This helps us sync your contacts and find your friends.</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save & Sync Contacts'}
        </button>
      </form>
    </div>
  );
}
```

### Step 6: Update Contact Sync Modal

Edit `frontend/src/components/chat/ContactSyncModal.jsx`:

```javascript
// Show browser support message more clearly
if (!navigator.contacts) {
  return (
    <div className="sync-modal">
      <h2>Sync Contacts</h2>
      
      <div className="browser-support">
        <p>📱 <strong>Chrome on Android</strong> is required for automatic contact sync.</p>
        
        <div className="alternatives">
          <h3>Alternative Options:</h3>
          <ul>
            <li>✅ Use Chrome on Android phone</li>
            <li>✅ Manually add contacts by phone number</li>
            <li>✅ Send invitation links to friends</li>
          </ul>
        </div>
      </div>
      
      <button onClick={() => setShowManualAdd(true)}>
        Add Contact Manually
      </button>
    </div>
  );
}

// If browser supports it
return (
  <div className="sync-modal">
    <h2>Sync Your Contacts</h2>
    <p>We'll find which of your contacts are already using iMessage.</p>
    
    <button onClick={syncDeviceContacts} disabled={loading}>
      {loading ? 'Syncing...' : 'Sync Contacts'}
    </button>
  </div>
);
```

### Step 7: Real-Time Contact Updates

Add Socket.IO listener for contact changes:

```javascript
// In useChatStore.js
subscribeToGlobalEvents: (socket) => {
  // ... existing code ...
  
  // Listen for contact updates
  socket.on('contactAdded', (contact) => {
    console.log('[SOCKET] New contact added:', contact);
    // Update contacts list in real-time
    set((state) => ({
      users: [...state.users, contact]
    }));
  });
  
  socket.on('contactUpdated', (contact) => {
    console.log('[SOCKET] Contact updated:', contact);
    // Update existing contact
    set((state) => ({
      users: state.users.map(u => 
        u._id === contact._id ? contact : u
      )
    }));
  });
}
```

### Step 8: Add Backend Endpoint for Contact Updates

Create `backend/src/controllers/contact.controller.js`:

```javascript
/**
 * Get all contacts for current user
 */
export async function getContacts(req, res) {
  try {
    const userId = req.user._id;
    
    // Get all users except current user
    const contacts = await User.find({
      _id: { $ne: userId }
    }).select('fullName email phoneNumber profilePic bio status lastSeen');
    
    console.log(`[GET-CONTACTS] Retrieved ${contacts.length} contacts for user ${userId}`);
    
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error in getContacts:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
}
```

### Step 9: Update Frontend Store

Add to `frontend/src/store/useContactStore.js`:

```javascript
export const useContactStore = create((set, get) => ({
  contacts: [],
  isLoadingContacts: false,

  getContacts: async () => {
    set({ isLoadingContacts: true });
    try {
      const res = await axiosInstance.get('/contacts');
      set({ contacts: res.data });
      console.log('[CONTACTS] Loaded', res.data.length, 'contacts');
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      set({ isLoadingContacts: false });
    }
  },

  updatePhoneNumber: async (phoneNumber) => {
    try {
      const res = await axiosInstance.put('/contacts/phone', { phoneNumber });
      console.log('[PHONE] Updated to:', res.data.phoneNumber);
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  syncContacts: async (phoneNumbers) => {
    try {
      const res = await axiosInstance.post('/contacts/sync', { phoneNumbers });
      set({ contacts: res.data.contacts });
      console.log('[SYNC] Found', res.data.total, 'contacts');
      return res.data;
    } catch (error) {
      throw error;
    }
  }
}));
```

## Testing Phone-First Flow

### Test 1: Verify Clerk Phone Requirement

1. Go to sign-up page
2. Try to sign up without phone number
3. Should show error: "Phone number is required"
4. Enter phone number
5. Sign up should succeed

### Test 2: Verify Webhook Syncing

1. Create new account with phone: +1234567890
2. Check backend logs:
   ```
   [CLERK-WEBHOOK] Normalized phone: +1234567890
   [CLERK-WEBHOOK] User synced - Email: user@example.com, Phone: +1234567890
   ```
3. Login and check profile
4. Phone number should be automatically filled

### Test 3: Verify Auto-Sync

1. Create two accounts:
   - User A: +1111111111
   - User B: +2222222222
2. Login as User A
3. Should see auto-sync message in logs
4. User B should appear in contacts list

### Test 4: Verify Real-Time Contact Updates

1. Open app in two browsers
2. In Browser A: Create new account
3. In Browser B: Should see new contact appear in real-time
4. Check logs for `[SOCKET] New contact added`

## Deployment Checklist

- [ ] Clerk configured to require phone number
- [ ] Webhook receiving phone numbers correctly
- [ ] Phone normalization working (E.164 format)
- [ ] Auto-sync contacts after login
- [ ] Phone setup modal shows on first login
- [ ] Contact sync modal works
- [ ] Real-time contact updates via Socket.IO
- [ ] Invitation links working
- [ ] Email/SMS delivery configured
- [ ] All logs showing correct messages

## Troubleshooting

### Problem: Phone number not syncing from Clerk

**Check**:
1. Clerk webhook is configured correctly
2. Backend logs show `[CLERK-WEBHOOK]` messages
3. Phone number is in E.164 format (+1234567890)
4. Database has phone number field

**Solution**:
```bash
# Check webhook logs
tail -f backend.log | grep CLERK-WEBHOOK

# Check database
db.users.findOne({ email: "user@example.com" })
# Should show: phoneNumber: "+1234567890"
```

### Problem: Contacts not syncing

**Check**:
1. User has phone number set
2. Other users have phone numbers in database
3. Phone numbers are normalized consistently
4. Contact sync endpoint is called

**Solution**:
```bash
# Check contact sync logs
tail -f backend.log | grep CONTACT-SYNC

# Manually test
curl -X POST http://localhost:3000/api/contacts/sync \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumbers": ["+1111111111", "+2222222222"]}'
```

### Problem: Real-time updates not working

**Check**:
1. Socket.IO is connected
2. Browser console shows no errors
3. Backend logs show socket events
4. FRONTEND_URL is correct

**Solution**:
```bash
# Check socket connection
# Open browser DevTools → Console
# Should show: Socket connected

# Check backend logs
tail -f backend.log | grep SOCKET
```

## Next Steps

1. ✅ Configure Clerk to require phone number
2. ✅ Verify webhook is receiving phone numbers
3. ✅ Implement auto-sync contacts
4. ✅ Enforce phone number on first login
5. ✅ Test all flows
6. ✅ Deploy to production
7. ✅ Monitor logs

## Related Documentation

- [EMAIL_SERVICE_SETUP.md](./EMAIL_SERVICE_SETUP.md) - Email configuration
- [BACKEND_IMPLEMENTATION_GUIDE.md](./BACKEND_IMPLEMENTATION_GUIDE.md) - Backend details
- [INVITATION_DELIVERY_GUIDE.md](./INVITATION_DELIVERY_GUIDE.md) - Invitation system

---

**Last Updated**: June 18, 2026
**Status**: ✅ Ready for Implementation
