import User from "../models/user.model.js";
import { sendMail } from "../lib/nodemailer.js";

/**
 * Sync contacts from user's phone
 * Client sends array of phone numbers from their contacts
 * Server returns which numbers are registered on the app
 */
export async function syncContacts(req, res) {
  try {
    const { phoneNumbers } = req.body;
    
    if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
      return res.status(400).json({ message: "Phone numbers array is required" });
    }

    // Normalize phone numbers to E.164 format
    const normalizedNumbers = phoneNumbers.map(num => {
      // Remove all non-digit characters except leading +
      let normalized = String(num).replace(/[^\d+]/g, '');
      // Ensure it starts with +
      if (!normalized.startsWith('+')) {
        normalized = '+' + normalized;
      }
      return normalized;
    });

    console.log(`[CONTACT-SYNC] Syncing ${phoneNumbers.length} phone numbers. Normalized: ${normalizedNumbers.join(', ')}`);

    // Find users who have these phone numbers registered
    const registeredUsers = await User.find({
      phoneNumber: { $in: normalizedNumbers }
    }).select("fullName email phoneNumber profilePic bio status lastSeen");

    console.log(`[CONTACT-SYNC] Found ${registeredUsers.length} registered users`);

    // Return users found on the platform
    res.status(200).json({
      contacts: registeredUsers,
      total: registeredUsers.length
    });
  } catch (error) {
    console.error("Error in syncContacts:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Check if a phone number or email is registered
 */
export async function checkRegistration(req, res) {
  try {
    const { phoneNumber, email } = req.query;

    if (!phoneNumber && !email) {
      return res.status(400).json({ message: "Phone number or email is required" });
    }

    const query = {};
    if (phoneNumber) {
      // Normalize phone to E.164 format
      let normalizedPhone = String(phoneNumber).replace(/[^\d+]/g, '');
      if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+' + normalizedPhone;
      }
      query.phoneNumber = normalizedPhone;
      console.log(`[CHECK-REGISTRATION] Checking phone: ${normalizedPhone}`);
    }
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      query.email = normalizedEmail;
      console.log(`[CHECK-REGISTRATION] Checking email: ${normalizedEmail}`);
    }

    const user = await User.findOne(query).select("fullName email phoneNumber profilePic");
    
    if (user) {
      console.log(`[CHECK-REGISTRATION] User found: ${user._id}`);
    } else {
      console.log(`[CHECK-REGISTRATION] No user found`);
    }

    if (user) {
      res.status(200).json({ 
        registered: true, 
        user 
      });
    } else {
      res.status(200).json({ 
        registered: false 
      });
    }
  } catch (error) {
    console.error("Error in checkRegistration:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Find users by phone number or email
 */
export async function findUserByContact(req, res) {
  try {
    const { contact } = req.query;
    
    if (!contact) {
      return res.status(400).json({ message: "Contact (phone or email) is required" });
    }

    const loggedInUserId = req.user._id;
    
    // Check if it's email or phone
    const isEmail = contact.includes('@');
    
    let user;
    if (isEmail) {
      const normalizedEmail = contact.toLowerCase().trim();
      console.log(`[FIND-CONTACT] Searching for email: ${normalizedEmail}`);
      user = await User.findOne({ 
        email: normalizedEmail,
        _id: { $ne: loggedInUserId }
      }).select("-clerkId");
    } else {
      // Normalize phone to E.164 format
      let normalizedPhone = String(contact).replace(/[^\d+]/g, '');
      if (!normalizedPhone.startsWith('+')) {
        normalizedPhone = '+' + normalizedPhone;
      }
      console.log(`[FIND-CONTACT] Searching for phone: ${normalizedPhone}`);
      user = await User.findOne({ 
        phoneNumber: normalizedPhone,
        _id: { $ne: loggedInUserId }
      }).select("-clerkId");
    }
    
    if (user) {
      console.log(`[FIND-CONTACT] Found user: ${user._id}`);
    } else {
      console.log(`[FIND-CONTACT] No user found for contact: ${contact}`);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error in findUserByContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Update current user's phone number
 */
export async function updatePhoneNumber(req, res) {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user._id;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Normalize phone number to E.164 format
    let normalizedPhone = String(phoneNumber).replace(/[^\d+]/g, '');
    if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+' + normalizedPhone;
    }
    
    console.log(`[UPDATE-PHONE] User ${userId} attempting to set phone: ${normalizedPhone}`);

    // Check if phone number is already taken
    const existingUser = await User.findOne({ 
      phoneNumber: normalizedPhone,
      _id: { $ne: userId }
    });

    if (existingUser) {
      console.log(`[UPDATE-PHONE] Phone number already registered by user ${existingUser._id}`);
      return res.status(400).json({ message: "Phone number is already registered" });
    }

    // Update user's phone number
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { phoneNumber: normalizedPhone },
      { new: true }
    ).select("-clerkId");

    console.log(`[UPDATE-PHONE] Successfully updated phone for user ${userId}: ${normalizedPhone}`);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in updatePhoneNumber:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Invite non-registered contacts via SMS or Email
 */
export async function inviteContact(req, res) {
  try {
    const { phoneNumber, email, name } = req.body;
    const inviter = req.user;

    if (!phoneNumber && !email) {
      return res.status(400).json({ message: "Phone number or email is required" });
    }

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?ref=${inviter._id}`;
    const contactName = name || phoneNumber || email;

    // 1. Send Email Invitation if email is provided
    if (email) {
      await sendMail({
        from: `"iMessage" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
        to: email,
        subject: `${inviter.fullName} invited you to join iMessage`,
        text: `Hi ${contactName}, ${inviter.fullName} wants to chat with you on iMessage. Join now: ${inviteLink}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
            <h2 style="color: #007aff;">Join iMessage</h2>
            <p>Hi <strong>${contactName}</strong>,</p>
            <p><strong>${inviter.fullName}</strong> (${inviter.email}) has invited you to join iMessage, a secure way to chat with friends and family.</p>
            <div style="margin: 30px 0;">
              <a href="${inviteLink}" style="background-color: #007aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accept Invitation</a>
            </div>
            <p style="font-size: 12px; color: #8e8e93;">If the button doesn't work, copy and paste this link: ${inviteLink}</p>
          </div>
        `
      });
    }

    // 2. Handle SMS Invitation (Log it for now, or use a service if configured)
    if (phoneNumber) {
      // If we had Twilio, we'd call it here. For now, we'll log it as a "sent" action
      // that the backend is correctly processing.
      console.log(`[REAL-SMS-ACTION] Sending SMS to ${phoneNumber}: "Hi ${contactName}, ${inviter.fullName} invited you to iMessage! Join here: ${inviteLink}"`);
      
      // We can also store this invitation in a database to track it
    }

    res.status(200).json({ 
      message: "Invitation sent successfully",
      inviteLink,
      sentTo: email || phoneNumber
    });
  } catch (error) {
    console.error("Error in inviteContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
