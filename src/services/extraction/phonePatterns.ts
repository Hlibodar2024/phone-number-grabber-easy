
// Configure phone number regular expressions for different formats
export const phoneRegexPatterns = [
  // Ukrainian format with spaces or dashes (most specific first)
  /\+380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  /380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // International formats
  /\+\d{1,3}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9}/g,
  // Basic number format with potential separators
  /\(?0\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  /\(?0\d{2}\)?[-\s]?\d{3}[-\s]?\d{4}/g,
  // Simple digit sequences that might be phone numbers (9+ digits)
  /\d{9,}/g
];

// Validate if a number matches phone number formats
export const isLikelyPhoneNumber = (number: string): boolean => {
  // Remove all non-digit characters except + for international prefix
  const cleaned = number.replace(/[^\d+]/g, '');
  
  // Special case for Ukrainian numbers
  if (cleaned.includes('380') || cleaned.startsWith('+380')) {
    return true;
  }
  
  // Phone number typical length check
  if (cleaned.length < 10 || cleaned.length > 15) return false;
  
  // Check for common phone number patterns
  if (cleaned.startsWith('+')) return true;
  if (cleaned.startsWith('0')) return true;
  
  return false;
};

// Extract phone numbers from text
export const extractPhoneNumbers = (text: string, cleanNumber: (number: string) => string, isLikelyCardNumber: (number: string) => boolean): string[] => {
  const numbers = new Set<string>();
  
  // First, try to extract Ukrainian phone numbers
  const ukrainianPattern = /(?:\+|)380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g;
  const ukrainianMatches = text.match(ukrainianPattern);
  if (ukrainianMatches) {
    ukrainianMatches.forEach(match => {
      const cleanedNumber = cleanNumber(match);
      if (!cleanedNumber.startsWith('+')) {
        numbers.add(`+${cleanedNumber}`);
      } else {
        numbers.add(cleanedNumber);
      }
    });
  }
  
  // Then try other patterns
  phoneRegexPatterns.forEach(regex => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        const cleanedNumber = cleanNumber(match);
        
        // Skip if it's likely a card number
        if (isLikelyCardNumber(cleanedNumber)) return;
        
        // Format Ukrainian numbers consistently
        if (cleanedNumber.includes('380') && !cleanedNumber.startsWith('+')) {
          if (cleanedNumber.startsWith('380')) {
            numbers.add(`+${cleanedNumber}`);
          } else if (cleanedNumber.startsWith('8380')) {
            numbers.add(`+${cleanedNumber.substring(1)}`);
          } else {
            numbers.add(cleanedNumber);
          }
        } else if (isLikelyPhoneNumber(cleanedNumber)) {
          numbers.add(cleanedNumber);
        }
      });
    }
  });
  
  return Array.from(numbers);
};
