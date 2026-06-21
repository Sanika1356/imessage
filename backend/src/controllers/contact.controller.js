import User from "../models/user.model.js";
import { sendMail } from "../lib/nodemailer.js";
import { normalizePhone, phonesMatch, getPhoneVariations, getPhoneDigits } from "../lib/phoneUtils.js";

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

    console.log(`[CONTACT-SYNC] Starting sync for ${phoneNumbers.length} phone numbers`);
    console.log(`[CONTACT-SYNC] Raw input: ${phoneNumbers.join(', ')}`);

    // Normalize phone numbers
    const normalizedNumbers = phoneNumbers.map(num => normalizePhone(num)).filter(Boolean);
    console.log(`[CONTACT-SYNC] Normalized: ${normalizedNumbers.join(', ')}`);

    // Get all variations for smart matching
    const phoneVariations = [];
    normalizedNumbers.forEach(num => {
      const variations = getPhoneVariations(num);
      phoneVariations.push(...variations);
      console.log(`[CONTACT-SYNC] Variations for ${num}: ${variations.join(', ')}`);
    });
    const uniqueVariations = [...new Set(phoneVariations)];
    console.log(`[CONTACT-SYNC] Total unique variations: ${uniqueVariations.length}`);

    // Step 1: Try exact match with variations
    let registeredUsers = await User.find({
      phoneNumber: { $in: uniqueVariations }
    }).select("fullName email phoneNumber profilePic bio status lastSeen");

    console.log(`[CONTACT-SYNC] Exact match found ${registeredUsers.length} users`);

    // Step 2: If no matches, try fuzzy matching on all users
    if (registeredUsers.length === 0) {
      console.log(`[CONTACT-SYNC] No exact matches found, attempting fuzzy matching...`);
      const allUsers = await User.find().select("fullName email phoneNumber profilePic bio status lastSeen");
      console.log(`[CONTACT-SYNC] Total users in database: ${allUsers.length}`);

      const matchedUsers = new Map();
      
      allUsers.forEach(user => {
        if (!user.phoneNumber) {
          console.log(`[CONTACT-SYNC] User ${user._id} has no phone number`);
          return;
        }

        normalizedNumbers.forEach(inputPhone => {
          if (phonesMatch(inputPhone, user.phoneNumber)) {
            console.log(`[CONTACT-SYNC] ✓ Fuzzy match: Input ${inputPhone} matches DB ${user.phoneNumber} (User: ${user.fullName})`);
            matchedUsers.set(user._id.toString(), user);
          }
        });
      });

      registeredUsers = Array.from(matchedUsers.values());
      console.log(`[CONTACT-SYNC] Fuzzy matching found ${registeredUsers.length} users`);
    }

    console.log(`[CONTACT-SYNC] Final result: ${registeredUsers.length} contacts found`);
    registeredUsers.forEach(u => {
      console.log(`[CONTACT-SYNC]   - ${u.fullName} (${u.phoneNumber})`);
    });

    // Return users found on the platform
    res.status(200).json({
      contacts: registeredUsers,
      total: registeredUsers.length,
      message: registeredUsers.length === 0 ? "No contacts found. Invite them to join!" : `Found ${registeredUsers.length} contacts`
    });
  } catch (error) {
    console.error("[CONTACT-SYNC] Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
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
      // Normalize phone and get variations for smart matching
      const normalizedPhone = normalizePhone(phoneNumber);
      const variations = getPhoneVariations(phoneNumber);
      query.phoneNumber = { $in: variations };
      console.log(`[CHECK-REGISTRATION] Checking phone: ${normalizedPhone}`);
      console.log(`[CHECK-REGISTRATION] Variations: ${variations.join(', ')}`);
    }
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      query.email = normalizedEmail;
      console.log(`[CHECK-REGISTRATION] Checking email: ${normalizedEmail}`);
    }

    const user = await User.findOne(query).select("fullName email phoneNumber profilePic");
    
    if (user) {
      console.log(`[CHECK-REGISTRATION] ✓ User found: ${user._id} (${user.fullName})`);
    } else {
      console.log(`[CHECK-REGISTRATION] ✗ No user found`);
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
    console.error("[CHECK-REGISTRATION] Error:", error.message);
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
      // Normalize and try exact match first
      const normalizedPhone = normalizePhone(contact);
      console.log(`[FIND-CONTACT] Searching for phone: ${normalizedPhone}`);
      
      user = await User.findOne({ 
        phoneNumber: normalizedPhone,
        _id: { $ne: loggedInUserId }
      }).select("-clerkId");

      // If no exact match, try smart matching
      if (!user) {
        console.log(`[FIND-CONTACT] No exact match, trying smart matching...`);
        const variations = getPhoneVariations(contact);
        user = await User.findOne({
          phoneNumber: { $in: variations },
          _id: { $ne: loggedInUserId }
        }).select("-clerkId");
        
        if (user) {
          console.log(`[FIND-CONTACT] ✓ Smart match found: ${contact} matches ${user.phoneNumber}`);
        }
      }
    }
    
    if (user) {
      console.log(`[FIND-CONTACT] ✓ Found user: ${user._id} (${user.fullName})`);
    } else {
      console.log(`[FIND-CONTACT] ✗ No user found for contact: ${contact}`);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("[FIND-CONTACT] Error:", error.message);
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

    // Normalize phone number
    const normalizedPhone = normalizePhone(phoneNumber);
    console.log(`[UPDATE-PHONE] User ${userId} attempting to set phone: ${normalizedPhone}`);

    // Check if phone number is already taken (using smart matching)
    const variations = getPhoneVariations(normalizedPhone);
    const existingUser = await User.findOne({ 
      phoneNumber: { $in: variations },
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

    console.log(`[UPDATE-PHONE] ✓ Successfully updated phone for user ${userId}: ${normalizedPhone}`);

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("[UPDATE-PHONE] Error:", error.message);
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

<<<<<<< HEAD
    const inviteLink = `${process.env.FRONTEND_URL}/invite?ref=${inviter._id}`;
    const message = `${inviter.fullName} invited you to join iMessage!\n\nConnect and chat: ${inviteLink}`;

    // Send actual invitation
    try {
      if (email) {
        // Send Email invitation using nodemailer
        const { sendEmail } = await import("../lib/nodemailer.js");
        
        await sendEmail({
          to: email,
          subject: `${inviter.fullName} invited you to iMessage`,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>You've been invited to iMessage!</h2>
              <p><strong>${inviter.fullName}</strong> wants to connect with you on iMessage.</p>
              <p>Click the button below to join and start chatting:</p>
              <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #25D366; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                Join iMessage
              </a>
              <p>Or copy this link: ${inviteLink}</p>
              <hr style="margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">If you didn't expect this invitation, you can safely ignore this email.</p>
            </div>
          `
        });

        console.log(`✅ Email invitation sent to ${email}`);
      }

      if (phoneNumber) {
        // For SMS, you would integrate with services like:
        // - Twilio
        // - AWS SNS
        // - MessageBird
        // For now, log it
        console.log(`📱 SMS invitation would be sent to ${phoneNumber}: ${message}`);
        
        // Example Twilio integration (commented out - requires Twilio account):
        /*
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
        
        if (accountSid && authToken && twilioPhone) {
          const client = require('twilio')(accountSid, authToken);
          await client.messages.create({
            body: message,
            from: twilioPhone,
            to: phoneNumber
          });
        }
        */
      }

      res.status(200).json({ 
        message: "Invitation sent successfully",
        inviteLink,
        sentVia: email ? "email" : "sms"
      });
    } catch (sendError) {
      console.error("Error sending invitation:", sendError);
      // Still return success with link even if sending fails
      res.status(200).json({ 
        message: "Invitation link generated (delivery may have failed)",
        inviteLink,
        warning: "Email/SMS service may not be configured"
      });
    }
=======
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?ref=${inviter._id}`;
    const contactName = name || phoneNumber || email;

    console.log(`[INVITE] Sending invitation from ${inviter.fullName} to ${email || phoneNumber}`);

    // 1. Send Email Invitation if email is provided
    if (email) {
      try {
        const emailResult = await sendMail({
          from: `"iMessage" <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: email,
          subject: `${inviter.fullName} invited you to join iMessage`,
          text: `Hi ${contactName}, ${inviter.fullName} wants to chat with you on iMessage. Join now: ${inviteLink}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px; background-color: #f9f9f9;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #007aff; margin: 0;">💬 Join iMessage</h2>
              </div>
              
              <p style="font-size: 16px; color: #333;">Hi <strong>${contactName}</strong>,</p>
              
              <p style="font-size: 16px; color: #333; line-height: 1.6;">
                <strong>${inviter.fullName}</strong> (${inviter.email}) has invited you to join <strong>iMessage</strong>, a secure way to chat with friends and family in real-time.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" style="background-color: #007aff; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Accept Invitation</a>
              </div>
              
              <p style="font-size: 14px; color: #666; border-top: 1px solid #ddd; padding-top: 20px;">
                If the button doesn't work, copy and paste this link in your browser:<br>
                <code style="background-color: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px; word-break: break-all;">${inviteLink}</code>
              </p>
              
              <p style="font-size: 12px; color: #999; margin-top: 20px; text-align: center;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          `
        });

        console.log(`[INVITE] ✓ Email sent to ${email}. Message ID: ${emailResult.messageId || 'N/A'}`);
      } catch (emailError) {
        console.error(`[INVITE] ✗ Failed to send email to ${email}:`, emailError.message);
        return res.status(500).json({ 
          message: "Failed to send invitation email",
          error: emailError.message 
        });
      }
    }

    // 2. Handle SMS Invitation (Log it for now, or use a service if configured)
    if (phoneNumber) {
      const normalizedPhone = normalizePhone(phoneNumber);
      console.log(`[INVITE] 📱 SMS invitation logged for ${normalizedPhone}`);
      console.log(`[INVITE] SMS content: "Hi ${contactName}, ${inviter.fullName} invited you to join iMessage! ${inviteLink}"`);
      
      // TODO: Integrate Twilio or another SMS service here
      // For now, we're just logging it as a tracked action
    }

    res.status(200).json({ 
      message: "Invitation sent successfully",
      inviteLink,
      sentTo: email || phoneNumber,
      timestamp: new Date().toISOString()
    });
>>>>>>> 634060a04e5d93827230372655c18bea0f5d5851
  } catch (error) {
    console.error("[INVITE] Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
