
// Configure phone number regular expressions for different formats
export const phoneRegexPatterns = [
  // Ukrainian format with proper +380 prefix (HIGHEST PRIORITY)
  /\+380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // Ukrainian formats with different prefixes (8 380, 380, etc.)
  /[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  /380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // Ukrainian formats with extended understanding of "8+380"
  /[8\s]+[+]?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
  /[8\s]+380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // Formats that are likely misrecognized Ukrainian numbers
  /[1\s]?[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // Handle Ukrainian numbers with parentheses
  /\(?[8\s]?380\)?[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // ДОДАНИЙ новий шаблон для "8 380" формату
  /8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g,
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
  
  // CRITICAL: ANY sequence with 380 should be considered a Ukrainian phone number
  if (cleaned.includes('380')) {
    return true;
  }
  
  // Перевірка формату "8 380"
  if (number.match(/8\s*380/)) {
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
  
  // First, directly look for Ukrainian patterns in the raw text
  // This must happen before any other processing
  const directUkrainianPatterns = [
    /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    /[8\s]+[+]?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
    /[\(]?8[\)]?\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    // ДОДАНИЙ новий шаблон для "8 380" формату
    /8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g,
  ];
  
  for (const pattern of directUkrainianPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Format Ukrainian numbers consistently with +380 prefix
        const digits = match.replace(/[^\d]/g, '');
        if (digits.includes('380')) {
          // Extract the portion starting with 380
          const index = digits.indexOf('380');
          let formattedNumber = `+${digits.substring(index)}`;
          numbers.add(formattedNumber);
        }
      });
    }
  }
  
  // If no Ukrainian numbers found through direct patterns, try the standard patterns
  if (numbers.size === 0) {
    phoneRegexPatterns.forEach(regex => {
      const matches = text.match(regex);
      if (matches) {
        matches.forEach(match => {
          const cleanedNumber = cleanNumber(match);
          
          // Skip if it's likely a card number and doesn't contain 380
          if (isLikelyCardNumber(cleanedNumber) && !cleanedNumber.includes('380')) return;
          
          // Format Ukrainian numbers consistently
          let formattedNumber = cleanedNumber;
          const digits = cleanedNumber.replace(/[^\d]/g, '');
          
          if (digits.includes('380')) {
            const index = digits.indexOf('380');
            formattedNumber = `+${digits.substring(index)}`;
          } else if (isLikelyPhoneNumber(cleanedNumber)) {
            formattedNumber = cleanedNumber;
          }
          
          numbers.add(formattedNumber);
        });
      }
    });
  }
  
  return Array.from(numbers);
};
