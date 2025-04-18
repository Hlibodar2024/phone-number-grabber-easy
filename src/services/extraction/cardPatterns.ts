
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
  // NEVER classify any string containing 380 as a card - Ukrainian phone
  if (number.includes('380') || number.match(/8\s*380/) || number.includes('+380')) {
    return false;
  }
  
  // Remove all spaces and non-digit characters
  const cleaned = number.replace(/\D/g, '');
  
  // NEVER classify numbers with 380 as cards
  if (cleaned.includes('380')) {
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
  // Critical preprocessing - NEVER try to extract cards from text containing Ukrainian phone patterns
  if (text.includes('380') || text.match(/8\s*380/) || text.includes('+380')) {
    console.log("Текст містить український телефонний номер - НЕ шукаємо картки");
    return [];
  }
  
  // Remove Ukrainian phone patterns completely before processing
  let cleanedText = text;
  const ukrainianPhonePatterns = [
    /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    /[8\s]+[+]?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    /\+?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /[1\s]?[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /\(?[8\s]?380\)?[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g,
  ];
  
  ukrainianPhonePatterns.forEach(pattern => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  
  // Critical check again - don't extract cards if there's any trace of 380
  if (cleanedText.includes('380')) {
    console.log("Текст все ще містить '380' після очищення - НЕ шукаємо картки");
    return [];
  }
  
  const numbers = new Set<string>();
  
  cardRegexPatterns.forEach(regex => {
    const matches = cleanedText.match(regex);
    if (matches) {
      matches.forEach(match => {
        const cleanedNumber = cleanNumber(match);
        const digitOnly = cleanedNumber.replace(/\D/g, '');
        
        // Троїста перевірка, щоб переконатися, що ми не включаємо номери українських телефонів
        if (!digitOnly.includes('380') && !match.includes('380') && !match.match(/8\s*380/)) {
          if (digitOnly.length >= 13 && digitOnly.length <= 19 && isLikelyCardNumber(cleanedNumber)) {
            numbers.add(cleanedNumber);
          }
        }
      });
    }
  });
  
  return Array.from(numbers).filter(card => {
    const digitOnly = card.replace(/\D/g, '');
    return !digitOnly.includes('380') && !card.match(/8\s*380/);
  });
};
