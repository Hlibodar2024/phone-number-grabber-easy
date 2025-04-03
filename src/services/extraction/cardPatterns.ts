
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
  // More relaxed pattern for card numbers
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
];

// Validate if the number is likely a credit card
export const isLikelyCardNumber = (number: string): boolean => {
  // Remove all spaces and non-digit characters
  const cleaned = number.replace(/\D/g, '');
  
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
  
  // First look for exact matches using regex
  cardRegexPatterns.forEach(regex => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        const cleanedNumber = cleanNumber(match);
        const digitOnly = cleanedNumber.replace(/\D/g, '');
        if (digitOnly.length >= 13 && digitOnly.length <= 19) {
          numbers.add(cleanedNumber);
        }
      });
    }
  });
  
  // Also try to find card numbers by looking at sequences of digits
  const allDigitSequences = text.match(/\d[\d\s-]{14,21}\d/g) || [];
  allDigitSequences.forEach(seq => {
    const cleanedSeq = cleanNumber(seq);
    const digitOnly = cleanedSeq.replace(/\D/g, '');
    if (digitOnly.length >= 13 && digitOnly.length <= 19) {
      numbers.add(cleanedSeq);
    }
  });
  
  return Array.from(numbers);
};
