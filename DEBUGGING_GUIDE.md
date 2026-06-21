# 🐛 Debugging Guide - Contact Sync & Email Delivery

## Overview

This guide helps you debug contact sync and email delivery issues using server logs.

## Server Startup Verification

When you start the backend, you should see:

```
[EMAIL-STARTUP] Verifying email configuration...
[EMAIL-STARTUP] ✓ Resend API configured
[EMAIL-STARTUP] ✓ SMTP configured (smtp.gmail.com:587)
[EMAIL-STARTUP] ✓ SMTP connection verified successfully

[SERVER-STARTUP] ✓ Server is up and running on PORT: 3000
[SERVER-STARTUP] ✓ Ready to accept connections
```

If you see warnings like:
```
[EMAIL-STARTUP] ⚠️  WARNING: No email service configured!
[EMAIL-STARTUP] All emails will be simulated.
```

Then you need to configure email service. See [EMAIL_SERVICE_SETUP.md](./EMAIL_SERVICE_SETUP.md).

## Contact Sync Debugging

### Scenario: "No contacts found" even though they should be there

**Step 1: Check Phone Numbers in Database**

```bash
# Connect to MongoDB
mongo "mongodb+srv://user:pass@cluster.mongodb.net/imessage"

# Check users and their phone numbers
db.users.find({}, { fullName: 1, email: 1, phoneNumber: 1 })

# Example output:
# { "_id": ObjectId(...), "fullName": "Alice", "email": "alice@example.com", "phoneNumber": "+15551111111" }
# { "_id": ObjectId(...), "fullName": "Bob", "email": "bob@example.com", "phoneNumber": "+15552222222" }
```

**Step 2: Check Backend Logs During Contact Sync**

```bash
# Start backend in debug mode
npm run dev

# In another terminal, trigger contact sync
curl -X POST http://localhost:3000/api/contacts/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumbers": ["+15551111111", "+15552222222"]}'

# Watch backend logs
tail -f backend.log | grep CONTACT-SYNC
```

**Expected logs:**
```
[CONTACT-SYNC] Starting sync for 2 phone numbers
[CONTACT-SYNC] Raw input: +15551111111, +15552222222
[CONTACT-SYNC] Normalized: +15551111111, +15552222222
[CONTACT-SYNC] Exact match found 2 users
[CONTACT-SYNC] Final result: 2 contacts found
[CONTACT-SYNC]   - Alice (+15551111111)
[CONTACT-SYNC]   - Bob (+15552222222)
```

**If you see "No exact matches found, attempting fuzzy matching...":**

This means the phone numbers don't match exactly. Check:

1. **Country Code Mismatch**
   ```
   Input: 5551111111 (no country code)
   Database: +15551111111 (with country code)
   ```
   
   The smart matching should handle this, but verify:
   ```bash
   tail -f backend.log | grep "Fuzzy match"
   # Should show: [CONTACT-SYNC] ✓ Fuzzy match: Input +15551111111 matches DB +15551111111
   ```

2. **Format Mismatch**
   ```
   Input: (555) 111-1111
   Database: +15551111111
   ```
   
   The normalization should convert it to `+15551111111`, but verify:
   ```bash
   tail -f backend.log | grep "Normalized:"
   # Should show: [CONTACT-SYNC] Normalized: +15551111111
   ```

3. **Different Country Codes**
   ```
   Input: +441234567890 (UK)
   Database: +15551111111 (US)
   ```
   
   These won't match. Make sure both users are using the same country code.

### Scenario: Contact found but not showing in app

**Check Socket.IO Connection:**

```javascript
// Open browser DevTools → Console
// Send a contact sync request
// Should see:
// [SOCKET] Received newMessage: {...}
// or
// Socket connected
```

If Socket.IO is not connected:
1. Check `FRONTEND_URL` in backend `.env`
2. Verify CORS settings
3. Check browser console for errors

**Check Frontend Store:**

```javascript
// In browser console
import { useChatStore } from './store/useChatStore';
const store = useChatStore.getState();
console.log('Contacts:', store.users);
// Should show the synced contacts
```

## Email Delivery Debugging

### Scenario: Email not received by recipient

**Step 1: Check Email Service Configuration**

```bash
# Check if email service is configured
curl http://localhost:3000/api/health/email

# Response should be:
# {
#   "status": "configured",
#   "resendConfigured": true,
#   "smtpConfigured": false,
#   "fromEmail": "noreply@yourdomain.com"
# }
```

If status is "simulated", configure email service first.

**Step 2: Check Backend Logs During Email Send**

```bash
# Send an email
curl -X POST http://localhost:3000/api/emails/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "friend@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello</h1>"
  }'

# Watch logs
tail -f backend.log | grep EMAIL
```

**Expected logs for successful delivery:**
```
[EMAIL-SEND] To: friend@example.com Attempting to send via Resend API...
[EMAIL-SEND] Resend payload prepared. Sending...
[EMAIL-SEND] ✓ Email sent successfully via Resend. ID: msg_123456789
```

**If you see simulated:**
```
[EMAIL-SEND] ⚠️  No email service configured. Simulating delivery...
[EMAIL-SEND] [SIMULATED EMAIL]
  From: sender@example.com
  To: friend@example.com
  Subject: Test Email
  Body Preview: <h1>Hello</h1>
```

**If you see failure:**
```
[EMAIL-SEND] ✗ Resend API error: Invalid API key
[EMAIL-SEND] ✗ Resend failed: Invalid API key. Falling back to SMTP...
[EMAIL-SEND] ✗ SMTP connection failed: ECONNREFUSED
[EMAIL-SEND] ⚠️  Falling back to simulation...
```

### Scenario: Email sent but recipient not notified in real-time

**Check Socket.IO Notification:**

```bash
# Watch for real-time email notifications
tail -f backend.log | grep EMAIL-DELIVERY-REALTIME

# Expected:
# [EMAIL-DELIVERY-REALTIME] Email notification sent to recipient via socket
```

If you don't see this:
1. Recipient might be offline
2. Socket.IO connection might be broken
3. Check `[EMAIL-DELIVERY-OFFLINE]` logs

**Check Recipient's Inbox:**

```bash
# In recipient's browser console
import { useChatStore } from './store/useChatStore';
const store = useChatStore.getState();
console.log('Emails:', store.emails);
// Should show the received email
```

## Invitation Debugging

### Scenario: Invitation email not received

**Check Logs:**

```bash
# Watch for invitation logs
tail -f backend.log | grep INVITE

# Expected:
# [INVITE] Sending invitation from Alice to bob@example.com
# [INVITE] ✓ Email sent to bob@example.com. Message ID: msg_123
```

**If email fails:**
```
# [INVITE] ✗ Failed to send email to bob@example.com: Invalid email address
# [INVITE] ✗ Email sent to bob@example.com. Message ID: N/A
```

**Check Email Content:**

```bash
# Look for the email in logs
tail -f backend.log | grep -A 5 "SIMULATED EMAIL"

# Should show:
# [SIMULATED EMAIL]
#   From: alice@example.com
#   To: bob@example.com
#   Subject: Alice invited you to join iMessage
#   Body Preview: <div style="...">Join iMessage</div>
```

## Common Issues & Solutions

| Issue | Logs to Check | Solution |
|-------|---------------|----------|
| Contacts not syncing | `[CONTACT-SYNC]` | Check phone numbers in DB, verify normalization |
| Email not sent | `[EMAIL-SEND]` | Configure email service, check credentials |
| No real-time updates | `[SOCKET]`, `[EMAIL-DELIVERY-REALTIME]` | Check Socket.IO connection, CORS settings |
| Invitation link broken | `[INVITE]` | Check `FRONTEND_URL` in `.env` |
| Phone number not updating | `[UPDATE-PHONE]` | Check if phone already registered |

## Log Levels Reference

### ✓ Success Logs (Green)
```
[CONTACT-SYNC] ✓ Fuzzy match found
[EMAIL-SEND] ✓ Email sent successfully
[INVITE] ✓ Email sent to recipient
[UPDATE-PHONE] ✓ Successfully updated phone
```

### ⚠️ Warning Logs (Yellow)
```
[EMAIL-STARTUP] ⚠️  WARNING: No email service configured
[EMAIL-SEND] ⚠️  No email service configured. Simulating delivery...
[EMAIL-DELIVERY-OFFLINE] Recipient is offline
```

### ✗ Error Logs (Red)
```
[CONTACT-SYNC] ✗ No user found
[EMAIL-SEND] ✗ Resend API error
[INVITE] ✗ Failed to send email
[UPDATE-PHONE] Phone number already registered
```

## Real-Time Monitoring

### Watch All Contact Sync Activity
```bash
tail -f backend.log | grep CONTACT-SYNC
```

### Watch All Email Activity
```bash
tail -f backend.log | grep EMAIL
```

### Watch All Socket.IO Activity
```bash
tail -f backend.log | grep SOCKET
```

### Watch All User Activity
```bash
tail -f backend.log | grep -E "CONTACT-SYNC|EMAIL|SOCKET|UPDATE-PHONE"
```

## Performance Debugging

### Check Database Query Performance

```javascript
// In MongoDB
db.users.find({}).explain("executionStats")

// Look for:
// - executionStages.stage: "COLLSCAN" (bad, means full table scan)
// - executionStages.stage: "IXSCAN" (good, means index scan)
```

### Check Socket.IO Performance

```bash
# Watch for slow operations
tail -f backend.log | grep -E "ms$"

# Should see response times
```

## Advanced Debugging

### Enable Verbose Logging

Add to `backend/src/controllers/contact.controller.js`:

```javascript
console.log('[DEBUG] Full user object:', JSON.stringify(user, null, 2));
```

### Test Phone Normalization Directly

```javascript
// In Node REPL
import { normalizePhone, phonesMatch, getPhoneVariations } from './backend/src/lib/phoneUtils.js';

normalizePhone('(555) 123-4567');
// Output: "+15551234567"

phonesMatch('5551234567', '+15551234567');
// Output: true

getPhoneVariations('+15551234567');
// Output: ["+15551234567", "+15551234567", "15551234567", "+15551234567", "5551234567"]
```

### Test Email Sending Directly

```javascript
// In Node REPL
import { sendMail } from './backend/src/lib/nodemailer.js';

const result = await sendMail({
  from: 'test@example.com',
  to: 'recipient@example.com',
  subject: 'Test',
  text: 'Test email',
  html: '<p>Test email</p>'
});

console.log('Result:', result);
// Should show: { messageId: "...", service: "resend", status: "delivered" }
```

## Getting Help

If you're still stuck:

1. **Check all logs**: `tail -f backend.log | head -100`
2. **Check email service status**: `curl http://localhost:3000/api/health/email`
3. **Check database**: Connect to MongoDB and verify data
4. **Check frontend console**: Look for JavaScript errors
5. **Check network tab**: Look for failed API requests

---

**Last Updated**: June 18, 2026
**Status**: ✅ Complete and Production-Ready
