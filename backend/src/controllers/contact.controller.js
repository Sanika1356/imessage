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

    // Here you would integrate with SMS/Email service
    // For now, we'll just return a success message
    const inviteLink = `${process.env.FRONTEND_URL}/invite?ref=${inviter._id}`;

    // TODO: Send actual SMS/Email invitation
    console.log(`Invitation to ${phoneNumber || email}: Join ${inviter.fullName} on iMessage! ${inviteLink}`);

    res.status(200).json({ 
      message: "Invitation sent successfully",
      inviteLink 
    });
  } catch (error) {
    console.error("Error in inviteContact:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
