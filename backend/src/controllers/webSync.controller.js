import User from "../models/user.model.js";
import { normalizePhone, getPhoneVariations, phonesMatch } from "../lib/phoneUtils.js";

/**
 * Parse VCF (vCard) file and extract phone numbers
 * VCF format example:
 * BEGIN:VCARD
 * VERSION:3.0
 * FN:John Doe
 * TEL:+1-555-123-4567
 * END:VCARD
 */
function parseVCF(vcfContent) {
  const contacts = [];
  const vCards = vcfContent.split("BEGIN:VCARD");

  vCards.forEach((vCard) => {
    if (!vCard.includes("END:VCARD")) return;

    const lines = vCard.split("\n");
    let name = "";
    let phone = "";
    let email = "";

    lines.forEach((line) => {
      const trimmed = line.trim();

      // Extract name
      if (trimmed.startsWith("FN:")) {
        name = trimmed.substring(3).trim();
      }

      // Extract phone
      if (trimmed.startsWith("TEL")) {
        const phoneMatch = trimmed.match(/:(.*?)$/);
        if (phoneMatch) {
          phone = phoneMatch[1].trim();
        }
      }

      // Extract email
      if (trimmed.startsWith("EMAIL")) {
        const emailMatch = trimmed.match(/:(.*?)$/);
        if (emailMatch) {
          email = emailMatch[1].trim();
        }
      }
    });

    if (phone || email) {
      contacts.push({
        name: name || "Unknown",
        phone: phone || null,
        email: email || null
      });
    }
  });

  return contacts;
}

/**
 * Sync contacts via VCF file upload (for laptop browsers)
 */
export async function syncContactsFromVCF(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "VCF file is required" });
    }

    const vcfContent = req.file.buffer.toString("utf-8");
    console.log(`[WEB-SYNC] Received VCF file: ${req.file.originalname}`);

    // Parse VCF file
    const contacts = parseVCF(vcfContent);
    console.log(`[WEB-SYNC] Parsed ${contacts.length} contacts from VCF file`);

    // Extract phone numbers
    const phoneNumbers = contacts
      .filter(c => c.phone)
      .map(c => c.phone);

    console.log(`[WEB-SYNC] Found ${phoneNumbers.length} phone numbers in VCF`);

    // Use existing sync logic
    const normalizedNumbers = phoneNumbers.map(num => normalizePhone(num)).filter(Boolean);
    console.log(`[WEB-SYNC] Normalized: ${normalizedNumbers.join(', ')}`);

    // Get all variations for smart matching
    const phoneVariations = [];
    normalizedNumbers.forEach(num => {
      const variations = getPhoneVariations(num);
      phoneVariations.push(...variations);
    });
    const uniqueVariations = [...new Set(phoneVariations)];

    // Step 1: Try exact match with variations
    let registeredUsers = await User.find({
      phoneNumber: { $in: uniqueVariations }
    }).select("fullName email phoneNumber profilePic bio status lastSeen");

    console.log(`[WEB-SYNC] Exact match found ${registeredUsers.length} users`);

    // Step 2: If no matches, try fuzzy matching
    if (registeredUsers.length === 0) {
      console.log(`[WEB-SYNC] No exact matches, attempting fuzzy matching...`);
      const allUsers = await User.find().select("fullName email phoneNumber profilePic bio status lastSeen");
      const matchedUsers = new Map();

      allUsers.forEach(user => {
        if (!user.phoneNumber) return;

        normalizedNumbers.forEach(inputPhone => {
          if (phonesMatch(inputPhone, user.phoneNumber)) {
            console.log(`[WEB-SYNC] Fuzzy match: ${inputPhone} matches ${user.phoneNumber}`);
            matchedUsers.set(user._id.toString(), user);
          }
        });
      });

      registeredUsers = Array.from(matchedUsers.values());
      console.log(`[WEB-SYNC] Fuzzy matching found ${registeredUsers.length} users`);
    }

    // Also include contacts that are NOT registered (for invitation)
    const unregisteredContacts = contacts.filter(contact => {
      if (!contact.phone) return false;
      const normalized = normalizePhone(contact.phone);
      return !registeredUsers.some(u => u.phoneNumber === normalized);
    });

    console.log(`[WEB-SYNC] Found ${unregisteredContacts.length} unregistered contacts for invitation`);

    res.status(200).json({
      registeredContacts: registeredUsers,
      unregisteredContacts: unregisteredContacts,
      totalRegistered: registeredUsers.length,
      totalUnregistered: unregisteredContacts.length,
      totalProcessed: contacts.length,
      message: `Synced ${contacts.length} contacts. Found ${registeredUsers.length} registered users.`
    });
  } catch (error) {
    console.error("[WEB-SYNC] Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * Sync contacts via manual bulk entry (for laptop browsers)
 * Client sends array of phone numbers and/or emails
 */
export async function syncContactsManual(req, res) {
  try {
    const { contacts } = req.body;

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: "Contacts array is required" });
    }

    console.log(`[WEB-SYNC-MANUAL] Received ${contacts.length} contacts for manual sync`);

    // Extract phone numbers and emails
    const phoneNumbers = contacts
      .filter(c => c.phone)
      .map(c => c.phone);

    const emails = contacts
      .filter(c => c.email)
      .map(c => c.email.toLowerCase().trim());

    console.log(`[WEB-SYNC-MANUAL] Found ${phoneNumbers.length} phone numbers and ${emails.length} emails`);

    // Normalize phone numbers
    const normalizedNumbers = phoneNumbers.map(num => normalizePhone(num)).filter(Boolean);

    // Get all variations for smart matching
    const phoneVariations = [];
    normalizedNumbers.forEach(num => {
      const variations = getPhoneVariations(num);
      phoneVariations.push(...variations);
    });
    const uniqueVariations = [...new Set(phoneVariations)];

    // Search by phone OR email
    const query = {
      $or: [
        { phoneNumber: { $in: uniqueVariations } },
        { email: { $in: emails } }
      ]
    };

    let registeredUsers = await User.find(query).select("fullName email phoneNumber profilePic bio status lastSeen");

    console.log(`[WEB-SYNC-MANUAL] Exact match found ${registeredUsers.length} users`);

    // Fuzzy matching if needed
    if (registeredUsers.length === 0) {
      console.log(`[WEB-SYNC-MANUAL] No exact matches, attempting fuzzy matching...`);
      const allUsers = await User.find().select("fullName email phoneNumber profilePic bio status lastSeen");
      const matchedUsers = new Map();

      allUsers.forEach(user => {
        // Try phone matching
        if (user.phoneNumber) {
          normalizedNumbers.forEach(inputPhone => {
            if (phonesMatch(inputPhone, user.phoneNumber)) {
              console.log(`[WEB-SYNC-MANUAL] Fuzzy match: ${inputPhone} matches ${user.phoneNumber}`);
              matchedUsers.set(user._id.toString(), user);
            }
          });
        }

        // Try email matching
        if (user.email) {
          emails.forEach(inputEmail => {
            if (user.email.toLowerCase() === inputEmail) {
              console.log(`[WEB-SYNC-MANUAL] Email match: ${inputEmail} matches ${user.email}`);
              matchedUsers.set(user._id.toString(), user);
            }
          });
        }
      });

      registeredUsers = Array.from(matchedUsers.values());
      console.log(`[WEB-SYNC-MANUAL] Fuzzy matching found ${registeredUsers.length} users`);
    }

    // Unregistered contacts for invitation
    const unregisteredContacts = contacts.filter(contact => {
      const normalized = normalizePhone(contact.phone);
      const emailLower = contact.email?.toLowerCase().trim();

      return !registeredUsers.some(u =>
        (normalized && u.phoneNumber === normalized) ||
        (emailLower && u.email === emailLower)
      );
    });

    console.log(`[WEB-SYNC-MANUAL] Found ${unregisteredContacts.length} unregistered contacts`);

    res.status(200).json({
      registeredContacts: registeredUsers,
      unregisteredContacts: unregisteredContacts,
      totalRegistered: registeredUsers.length,
      totalUnregistered: unregisteredContacts.length,
      totalProcessed: contacts.length,
      message: `Synced ${contacts.length} contacts. Found ${registeredUsers.length} registered users.`
    });
  } catch (error) {
    console.error("[WEB-SYNC-MANUAL] Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

/**
 * Get sync status and instructions
 */
export async function getSyncStatus(req, res) {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("phoneNumber");

    if (!user.phoneNumber) {
      return res.status(400).json({
        status: "incomplete",
        message: "Phone number is required to sync contacts",
        nextStep: "Add your phone number to your profile"
      });
    }

    res.status(200).json({
      status: "ready",
      phoneNumber: user.phoneNumber,
      syncMethods: [
        {
          name: "Chrome Android",
          description: "Sync directly from your phone's contacts",
          supported: true
        },
        {
          name: "VCF File Upload",
          description: "Upload a .vcf file from your computer",
          supported: true
        },
        {
          name: "Manual Entry",
          description: "Manually add phone numbers or emails",
          supported: true
        }
      ]
    });
  } catch (error) {
    console.error("[SYNC-STATUS] Error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
