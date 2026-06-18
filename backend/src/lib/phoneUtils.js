/**
 * Phone Number Utility Functions
 * Handles phone number normalization and smart matching for contact sync
 */

/**
 * Normalize phone number to E.164 format
 * Examples:
 *   "5551234567" → "+15551234567"
 *   "(555) 123-4567" → "+15551234567"
 *   "+1 555 123 4567" → "+15551234567"
 *   "555-123-4567" → "+15551234567"
 */
export function normalizePhone(phone, defaultCountryCode = '1') {
  if (!phone) return null;

  // Remove all non-digit characters except leading +
  let normalized = String(phone).replace(/[^\d+]/g, '');

  // If no + prefix, add it
  if (!normalized.startsWith('+')) {
    // If it doesn't start with a country code, assume default (US: 1)
    if (normalized.length === 10) {
      // Assume US number without country code
      normalized = '+' + defaultCountryCode + normalized;
    } else if (normalized.length === 11 && normalized.startsWith('1')) {
      // Already has US country code
      normalized = '+' + normalized;
    } else if (normalized.length > 10) {
      // Assume it has country code
      normalized = '+' + normalized;
    } else {
      // Too short, add default country code
      normalized = '+' + defaultCountryCode + normalized;
    }
  }

  return normalized;
}

/**
 * Extract just the digits from a phone number
 */
export function getPhoneDigits(phone) {
  if (!phone) return null;
  return String(phone).replace(/\D/g, '');
}

/**
 * Check if two phone numbers match (smart matching)
 * Handles cases where one might be missing country code, etc.
 */
export function phonesMatch(phone1, phone2) {
  if (!phone1 || !phone2) return false;

  const norm1 = normalizePhone(phone1);
  const norm2 = normalizePhone(phone2);

  // Exact match
  if (norm1 === norm2) return true;

  // Try matching without country code
  const digits1 = getPhoneDigits(norm1);
  const digits2 = getPhoneDigits(norm2);

  if (digits1 && digits2) {
    // Match last 10 digits (common for US numbers)
    const last10_1 = digits1.slice(-10);
    const last10_2 = digits2.slice(-10);
    if (last10_1 === last10_2 && last10_1.length === 10) {
      return true;
    }

    // Exact digit match
    if (digits1 === digits2) return true;
  }

  return false;
}

/**
 * Get all variations of a phone number for matching
 * This helps find matches even if formatting is different
 */
export function getPhoneVariations(phone) {
  if (!phone) return [];

  const normalized = normalizePhone(phone);
  const digits = getPhoneDigits(normalized);
  const variations = [normalized];

  if (digits) {
    // Add with + prefix
    variations.push('+' + digits);

    // Add without + prefix
    variations.push(digits);

    // Add last 10 digits (for US)
    if (digits.length >= 10) {
      variations.push('+1' + digits.slice(-10));
      variations.push(digits.slice(-10));
    }
  }

  // Remove duplicates
  return [...new Set(variations)];
}

/**
 * Format phone number for display
 * Examples:
 *   "+15551234567" → "(555) 123-4567"
 *   "+441234567890" → "+44 1234 567890"
 */
export function formatPhoneForDisplay(phone) {
  if (!phone) return '';

  const digits = getPhoneDigits(phone);
  if (!digits) return phone;

  // US format
  if (digits.length === 11 && digits.startsWith('1')) {
    const areaCode = digits.substring(1, 4);
    const exchange = digits.substring(4, 7);
    const subscriber = digits.substring(7);
    return `(${areaCode}) ${exchange}-${subscriber}`;
  }

  // International format
  if (digits.length > 10) {
    const countryCode = digits.substring(0, digits.length - 10);
    const areaCode = digits.substring(digits.length - 10, digits.length - 7);
    const exchange = digits.substring(digits.length - 7, digits.length - 4);
    const subscriber = digits.substring(digits.length - 4);
    return `+${countryCode} ${areaCode} ${exchange} ${subscriber}`;
  }

  // Default: just add + prefix
  return '+' + digits;
}

/**
 * Validate if a string looks like a phone number
 */
export function isValidPhoneFormat(phone) {
  if (!phone) return false;
  const digits = getPhoneDigits(phone);
  // Phone number should have at least 10 digits
  return digits && digits.length >= 10;
}

export default {
  normalizePhone,
  getPhoneDigits,
  phonesMatch,
  getPhoneVariations,
  formatPhoneForDisplay,
  isValidPhoneFormat
};
