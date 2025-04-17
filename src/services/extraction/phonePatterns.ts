
// Configure phone number regular expressions for different formats
export const phoneRegexPatterns = [
  // Ukrainian format with proper +380 prefix
  /\+380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // Ukrainian formats with different prefixes (8 380, 380, etc.)
  /[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  /380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  // Formats that are likely misrecognized Ukrainian numbers
  /[1\s]?[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
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
  
  // Special case for Ukrainian numbers - ANY number with 380 in it
  if (cleaned.includes('380') || cleaned.startsWith('+380') || 
      cleaned.startsWith('8380') || cleaned.match(/^1?\s?8?\s?380/)) {
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
  
  // First, try to extract Ukrainian phone numbers with different prefixes
  const ukrainianPatterns = [
    /(?:\+|)380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    /[1\s]?[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  ];
  
  ukrainianPatterns.forEach(pattern => {
    const ukrainianMatches = text.match(pattern);
    if (ukrainianMatches) {
      ukrainianMatches.forEach(match => {
        const cleanedNumber = cleanNumber(match);
        let formattedNumber = cleanedNumber;
        
        // Format Ukrainian numbers consistently with +380 prefix
        if (cleanedNumber.includes('380')) {
          if (cleanedNumber.startsWith('1') && cleanedNumber.includes('8380')) {
            // Handle "1 8 380" format (OCR mistake)
            formattedNumber = `+${cleanedNumber.replace(/^1\s?8\s?/, '')}`;
          } else if (cleanedNumber.startsWith('8') && !cleanedNumber.startsWith('8380')) {
            // Handle "8 380" format (without the 8 being part of the code)
            formattedNumber = `+${cleanedNumber.substring(1)}`;
          } else if (cleanedNumber.startsWith('8380')) {
            // Handle "8380" format (with the 8 being an OCR mistake)
            formattedNumber = `+${cleanedNumber.substring(1)}`;
          } else if (cleanedNumber.startsWith('380')) {
            formattedNumber = `+${cleanedNumber}`;
          }
        }
        
        numbers.add(formattedNumber);
      });
    }
  });
  
  // Then try other patterns if needed
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
          
          if (cleanedNumber.includes('380')) {
            if (cleanedNumber.startsWith('1') && cleanedNumber.includes('8380')) {
              // Handle "1 8 380" format (OCR mistake)
              formattedNumber = `+${cleanedNumber.replace(/^1\s?8\s?/, '')}`;
            } else if (cleanedNumber.startsWith('8') && !cleanedNumber.startsWith('8380')) {
              // Handle "8 380" format (without the 8 being part of the code)
              formattedNumber = `+${cleanedNumber.substring(1)}`;
            } else if (cleanedNumber.startsWith('8380')) {
              // Handle "8380" format (with the 8 being an OCR mistake)
              formattedNumber = `+${cleanedNumber.substring(1)}`;
            } else if (cleanedNumber.startsWith('380')) {
              formattedNumber = `+${cleanedNumber}`;
            }
          } else if (isLikelyPhoneNumber(cleanedNumber)) {
            formattedNumber = cleanedNumber;
          }
          
          numbers.add(formattedNumber);
        });
      }
    });
  }
  
  // Ensure all Ukrainian numbers are properly formatted
  const result = Array.from(numbers);
  return result.map(num => {
    // Final cleaning for Ukrainian numbers
    if (num.includes('380') && !num.startsWith('+')) {
      if (num.startsWith('8380')) {
        return `+${num.substring(1)}`;
      } else if (num.startsWith('380')) {
        return `+${num}`;
      }
    }
    return num;
  });
};
