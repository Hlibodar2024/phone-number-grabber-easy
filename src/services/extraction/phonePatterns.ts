
// Configure phone number regular expressions for different formats
export const phoneRegexPatterns = [
  // International formats
  /\+\d{1,3}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9}/g,
  // Basic number format with potential separators
  /\(?0\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  /\(?0\d{2}\)?[-\s]?\d{3}[-\s]?\d{4}/g,
  // Ukrainian format with spaces or dashes
  /\+380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // Simple digit sequences that might be phone numbers (9+ digits)
  /\d{9,}/g
];

// Validate if a number matches phone number formats
export const isLikelyPhoneNumber = (number: string): boolean => {
  // Remove all non-digit characters except + for international prefix
  const cleaned = number.replace(/[^\d+]/g, '');
  
  // Phone number typical length check
  if (cleaned.length < 10 || cleaned.length > 15) return false;
  
  // Check for common phone number patterns
  if (cleaned.startsWith('+')) return true;
  if (cleaned.startsWith('0')) return true;
  if (cleaned.startsWith('380')) return true;
  
  return false;
};

// Extract phone numbers from text
export const extractPhoneNumbers = (text: string, cleanNumber: (number: string) => string, isLikelyCardNumber: (number: string) => boolean): string[] => {
  const numbers = new Set<string>();
  
  phoneRegexPatterns.forEach(regex => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        const cleanedNumber = cleanNumber(match);
        if (isLikelyPhoneNumber(cleanedNumber) && !isLikelyCardNumber(cleanedNumber)) {
          numbers.add(cleanedNumber);
        }
      });
    }
  });
  
  return Array.from(numbers);
};
