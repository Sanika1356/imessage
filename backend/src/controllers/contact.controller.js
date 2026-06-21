import User from "../models/user.model.js";

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

    // Normalize phone numbers (remove spaces, dashes, etc.)
    const normalizedNumbers = phoneNumbers.map(num => 
      num.replace(/[\s\-\(\)]/g, '')
    );

    // Find users who have these phone numbers registered
    const registeredUsers = await User.find({
      phoneNumber: { $in: normalizedNumbers }
    }).select("fullName email phoneNumber profilePic bio status lastSeen");

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
      query.phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    }
    if (email) {
      query.email = email.toLowerCase();
    }

    const user = await User.findOne(query).select("fullName email phoneNumber profilePic");

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
      user = await User.findOne({ 
        email: contact.toLowerCase(),
        _id: { $ne: loggedInUserId }
      }).select("-clerkId");
    } else {
      const normalizedPhone = contact.replace(/[\s\-\(\)]/g, '');
      user = await User.findOne({ 
        phoneNumber: normalizedPhone,
        _id: { $ne: loggedInUserId }
      }).select("-clerkId");
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

    // Normalize phone number
    const normalizedPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Check if phone number is already taken
    const existingUser = await User.findOne({ 
      phoneNumber: normalizedPhone,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Phone number is already registered" });
    }

    // Update user's phone number
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { phoneNumber: normalizedPhone },
      { new: true }
    ).select("-clerkId");

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
  } catch (error) {
    console.error("Error in inviteContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
