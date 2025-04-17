
// Configure credit card number regular expressions
export const cardRegexPatterns = [
  // Card numbers with spaces (exactly in format: XXXX XXXX XXXX XXXX)
  /\b\d{4}\s\d{4}\s\d{4}\s\d{4}\b/g,
  // Card numbers with different separators or no separators
  /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
  // Visa pattern starting with 4
  /\b4\d{3}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // Mastercard pattern starting with 5
  /\b5\d{3}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // 16 digits in a row
  /\b\d{16}\b/g,
  // More relaxed pattern for card numbers with any separator
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  // More permissive pattern for any 16 digits potentially representing a card
  /\b[\d\s-]{16,19}\b/g,
  // Find partial card numbers
  /4\d{3}[\s-]?\d{4}[\s-]?\d{4}/g,  // Partial Visa (last 4 might be missing)
  /5\d{3}[\s-]?\d{4}[\s-]?\d{4}/g,  // Partial Mastercard (last 4 might be missing)
];

// Validate if the number is likely a credit card
export const isLikelyCardNumber = (number: string): boolean => {
  // Remove all spaces and non-digit characters
  const cleaned = number.replace(/\D/g, '');
  
  // IMPORTANT: Exclude ANY numbers that have 380 sequence - these are Ukrainian phone numbers
  if (cleaned.includes('380') || 
      cleaned.startsWith('380') || 
      cleaned.match(/8380/) ||
      cleaned.match(/1\s?8\s?380/) ||
      cleaned.match(/8\s?380/)) {
    return false;
  }
  
  // Card number length check (most cards are 16 digits, some are 13-19)
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  // Check if it starts with common card prefixes
  if (cleaned.startsWith('4') || // Visa
      cleaned.startsWith('5') || // Mastercard
      cleaned.startsWith('34') || cleaned.startsWith('37') || // American Express
      cleaned.startsWith('6')) { // Discover, UnionPay, etc.
    return true;
  }
  
  // Basic Luhn algorithm (checksum) for credit card validation
  let sum = 0;
  let double = false;
  
  // Loop from right to left
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i));
    
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    
    sum += digit;
    double = !double;
  }
  
  return sum % 10 === 0;
};

// Extract credit card numbers from text
export const extractCardNumbers = (text: string, cleanNumber: (number: string) => string): string[] => {
  const numbers = new Set<string>();
  
  // First exclude anything that looks like a Ukrainian phone number
  let textForCardExtraction = text;
  
  // Remove Ukrainian phone patterns from the text to avoid false positives
  const ukrainianPhonePatterns = [
    /\+?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /[1\s]?[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  ];
  
  ukrainianPhonePatterns.forEach(pattern => {
    textForCardExtraction = textForCardExtraction.replace(pattern, '');
  });
  
  // Now look for card patterns in the cleaned text
  cardRegexPatterns.forEach(regex => {
    const matches = textForCardExtraction.match(regex);
    if (matches) {
      matches.forEach(match => {
        const cleanedNumber = cleanNumber(match);
        const digitOnly = cleanedNumber.replace(/\D/g, '');
        
        // Double-check to exclude Ukrainian phone numbers
        if (digitOnly.includes('380') || 
            digitOnly.match(/8380/) || 
            digitOnly.match(/8\s?380/)) {
          return;
        }
        
        if (digitOnly.length >= 13 && digitOnly.length <= 19) {
          numbers.add(cleanedNumber);
        }
      });
    }
  });
  
  // Extract potential card numbers but exclude anything with 380
  const potentialMatches = textForCardExtraction.match(/\d[\d\s-]{14,21}\d/g) || [];
  potentialMatches.forEach(match => {
    const cleanedMatch = cleanNumber(match);
    const digitOnly = cleanedMatch.replace(/\D/g, '');
    
    // Skip Ukrainian phone numbers
    if (digitOnly.includes('380') || 
        digitOnly.match(/8380/) || 
        digitOnly.match(/8\s?380/)) {
      return;
    }
    
    if (digitOnly.length >= 13 && digitOnly.length <= 19) {
      // Check for the Luhn algorithm or prefix patterns for higher confidence
      if (isLikelyCardNumber(cleanedMatch)) {
        numbers.add(cleanedMatch);
      }
    }
  });
  
  return Array.from(numbers);
};
