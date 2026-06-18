# 📧 Email Service Setup Guide

## Overview

This guide explains how to configure email delivery for the iMessage application. Without proper email configuration, emails will be **simulated** (logged but not actually sent).

## Quick Start

### Option 1: Using Resend (Recommended for Production)

Resend is the easiest and most reliable option for production.

1. **Create Account**
   - Go to [resend.com](https://resend.com)
   - Sign up with your email
   - Verify your email

2. **Get API Key**
   - Go to Dashboard → API Keys
   - Create a new API key
   - Copy the key (starts with `re_`)

3. **Configure Backend**
   - Open `backend/.env`
   - Add these lines:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Verify Domain (Optional but Recommended)**
   - In Resend dashboard, add your domain
   - Follow DNS verification steps
   - This ensures emails don't go to spam

5. **Test**
   ```bash
   # Restart backend
   npm run dev

   # Send a test email from the app
   # Check backend logs for: [EMAIL-DELIVERY-SUCCESS]
   ```

### Option 2: Using Gmail SMTP (For Development/Testing)

Gmail is free and works well for testing.

1. **Enable 2-Step Verification**
   - Go to [myaccount.google.com/security](https://myaccount.google.com/security)
   - Click "2-Step Verification"
   - Follow the setup process

2. **Generate App Password**
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer" (or your OS)
   - Google will generate a 16-character password
   - Copy it (you'll only see it once)

3. **Configure Backend**
   - Open `backend/.env`
   - Add these lines:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   RESEND_FROM_EMAIL=your-email@gmail.com
   ```

4. **Test**
   ```bash
   # Restart backend
   npm run dev

   # Send a test email from the app
   # Check backend logs for: [EMAIL-DELIVERY-SUCCESS]
   ```

### Option 3: Using SendGrid (For Production)

SendGrid is reliable and has good free tier.

1. **Create Account**
   - Go to [sendgrid.com](https://sendgrid.com)
   - Sign up
   - Verify your email

2. **Get SMTP Credentials**
   - Go to Settings → API Keys
   - Create a new API key
   - Copy the key

3. **Configure Backend**
   - Open `backend/.env`
   - Add these lines:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

4. **Verify Domain**
   - In SendGrid, add and verify your domain
   - This improves deliverability

## Troubleshooting

### Problem: "Email was SIMULATED"

**Cause**: No email service is configured

**Solution**:
1. Check `backend/.env` for `RESEND_API_KEY` or `SMTP_HOST`
2. If missing, follow setup steps above
3. Restart backend: `npm run dev`
4. Check logs: `tail -f backend.log | grep EMAIL`

### Problem: "Failed to dispatch email"

**Cause**: Email service credentials are incorrect

**Solution**:
1. Verify API key is correct
2. Check SMTP credentials
3. Ensure `RESEND_FROM_EMAIL` is set
4. For Gmail: Make sure you generated an App Password (not your regular password)
5. Check backend logs for detailed error

### Problem: Emails go to spam

**Cause**: Domain not verified or SPF/DKIM not configured

**Solution**:
1. Verify your domain in the email service
2. Add SPF record to your domain DNS:
   ```
   v=spf1 include:sendgrid.net ~all
   ```
3. Add DKIM record (provided by email service)
4. Wait 24-48 hours for DNS to propagate

### Problem: "Connection timeout"

**Cause**: Firewall or network issue

**Solution**:
1. Check if port 587 is open
2. Try different email service
3. Check backend logs for detailed error
4. Verify internet connection

## Testing Email Delivery

### Test 1: Send Email via API

```bash
# 1. Get your auth token (from browser DevTools or Clerk)
TOKEN="your_clerk_token"

# 2. Send test email
curl -X POST http://localhost:3000/api/emails/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "test@example.com",
    "subject": "Test Email",
    "body": "<h1>Hello</h1><p>This is a test email</p>"
  }'

# 3. Check response
# Should return: { "message": "Email sent successfully" }
```

### Test 2: Check Backend Logs

```bash
# Watch for email delivery logs
tail -f backend.log | grep EMAIL

# Expected output:
# [EMAIL-DELIVERY-SUCCESS] Email delivered to test@example.com. ID: msg_123
# OR
# [EMAIL-DELIVERY-INFO] Email was SIMULATED because SMTP/Resend not configured
```

### Test 3: Send Invitation

```bash
# 1. Send invitation from the app UI
# Click "Add Contact" → Enter email → Send Invitation

# 2. Check backend logs
tail -f backend.log | grep -E "EMAIL|INVITATION"

# 3. Check recipient's email inbox
# Look for email from your app
```

### Test 4: Verify Real-Time Delivery

```bash
# 1. Open app in two browser windows
# Window A: User 1
# Window B: User 2

# 2. In Window A, send an email to User 2's email
# 3. In Window B, check if email appears in inbox in real-time
# 4. Check backend logs for: [EMAIL-DELIVERY-REALTIME]
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Email service configured (Resend, Gmail, or SendGrid)
- [ ] API key or SMTP credentials set in `backend/.env`
- [ ] `RESEND_FROM_EMAIL` configured
- [ ] Domain verified in email service
- [ ] SPF/DKIM records added (if applicable)
- [ ] Test email sent successfully
- [ ] Backend logs show `[EMAIL-DELIVERY-SUCCESS]`
- [ ] Real-time delivery working (Socket.IO)

### Environment Variables

```env
# Email Service (choose one)
RESEND_API_KEY=re_xxx              # For Resend
# OR
SMTP_HOST=smtp.gmail.com           # For Gmail/SendGrid
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# Required for all
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Core
MONGODB_URI=mongodb+srv://...
CLERK_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=https://yourdomain.com
```

### Deployment Platforms

**Backend**:
- Render.com
- Railway.app
- Fly.io
- Heroku

**Database**:
- MongoDB Atlas (free tier available)

**Frontend**:
- Vercel
- Netlify
- Cloudflare Pages

### Example: Deploy to Render

1. Create account at [render.com](https://render.com)
2. Connect GitHub repository
3. Create new Web Service
4. Set environment variables:
   ```
   RESEND_API_KEY=re_xxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   MONGODB_URI=mongodb+srv://...
   CLERK_WEBHOOK_SECRET=whsec_xxx
   FRONTEND_URL=https://your-frontend.vercel.app
   ```
5. Deploy

## Email Logs Reference

### Success Logs

```
[EMAIL-DELIVERY-SUCCESS] Email delivered to user@example.com. ID: msg_123
[EMAIL-DELIVERY-REALTIME] Email notification sent to recipient via socket
[EMAIL-CREATED] Email from sender@example.com to recipient@example.com saved to inbox
[EMAIL-SENT] Email sent from sender@example.com to recipient@example.com
```

### Info Logs

```
[EMAIL-DELIVERY-INFO] Email was SIMULATED because SMTP/Resend not configured
[EMAIL-DELIVERY-OFFLINE] Recipient is offline - email saved to inbox
[EMAIL-NOT-INTERNAL] Recipient not found in app - external email only
```

### Error Logs

```
[EMAIL-DELIVERY-FAILURE] Failed to dispatch email: Connection timeout
[ERROR] Error in sendEmail: Invalid email address
```

## Advanced Configuration

### Custom Email Template

Edit `backend/src/controllers/email.controller.js`:

```javascript
// Find this section:
html: `<div style="font-family: sans-serif; line-height: 1.5;">${body}</div>`

// Replace with your custom template:
html: `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
    <h1 style="color: #007aff;">iMessage</h1>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
      ${body}
    </div>
    <p style="font-size: 12px; color: #8e8e93; margin-top: 20px;">
      This is an automated message from iMessage. Please do not reply.
    </p>
  </div>
`
```

### Rate Limiting

Add rate limiting to prevent email spam:

```javascript
// backend/src/routes/email.route.js
import rateLimit from 'express-rate-limit';

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20 // 20 emails per 15 minutes
});

router.post('/send', emailLimiter, sendEmail);
```

### Webhook Handling (Optional)

For advanced tracking, set up webhooks:

**Resend**:
1. Go to Webhooks in Resend dashboard
2. Add endpoint: `https://yourdomain.com/api/webhooks/email`
3. Select events: `email.sent`, `email.bounced`, `email.complained`

**SendGrid**:
1. Go to Mail Settings → Event Webhook
2. Add endpoint: `https://yourdomain.com/api/webhooks/email`
3. Select events: `sent`, `bounce`, `complaint`

## Support

### Check Logs

```bash
# View recent email logs
tail -100 backend.log | grep EMAIL

# Filter by status
tail -100 backend.log | grep EMAIL-DELIVERY-SUCCESS
tail -100 backend.log | grep EMAIL-DELIVERY-FAILURE
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Email simulated | Configure RESEND_API_KEY or SMTP |
| Connection timeout | Check firewall, try different service |
| Invalid credentials | Verify API key or SMTP password |
| Emails in spam | Verify domain, add SPF/DKIM |
| No real-time notification | Check Socket.IO connection |

## Next Steps

1. ✅ Choose email service (Resend recommended)
2. ✅ Configure backend `.env`
3. ✅ Test email delivery
4. ✅ Verify real-time Socket.IO delivery
5. ✅ Deploy to production
6. ✅ Monitor logs for delivery status

---

**Last Updated**: June 18, 2026
**Status**: ✅ Complete and Production-Ready
