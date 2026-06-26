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

    // 2. Handle SMS Invitation
    if (phoneNumber) {
      const normalizedPhone = normalizePhone(phoneNumber);
      console.log(`[INVITE] 📱 SMS invitation logged for ${normalizedPhone}`);
      console.log(`[INVITE] SMS content: "Hi ${contactName}, ${inviter.fullName} invited you to join iMessage! ${inviteLink}"`);
      // SMS service integration would go here (e.g., Twilio)
    }

    res.status(200).json({ 
      message: "Invitation processed successfully",
      inviteLink,
      sentVia: email ? "email" : "sms"
    });

  } catch (error) {
    console.error("[INVITE] Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
