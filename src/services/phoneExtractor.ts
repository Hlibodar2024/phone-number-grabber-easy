import { createWorker } from 'tesseract.js';

// Configure phone number regular expressions for different formats
const phoneRegexPatterns = [
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

// Configure credit card number regular expressions
const cardRegexPatterns = [
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

// Clean up the extracted number
const cleanNumber = (number: string): string => {
  return number.replace(/\s+/g, ' ').trim();
};

// Validate if the number is likely a credit card
const isLikelyCardNumber = (number: string): boolean => {
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

// Validate if a number matches phone number formats
const isLikelyPhoneNumber = (number: string): boolean => {
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

// Advanced preprocessing of text before extraction
const preprocessText = (text: string): string => {
  // Replace common OCR mistakes in card numbers
  let processed = text;
  processed = processed.replace(/[oO]/g, '0'); // Replace 'o' or 'O' with '0'
  processed = processed.replace(/[iIlL]/g, '1'); // Replace 'i', 'I', 'l', 'L' with '1'
  processed = processed.replace(/[zZ]/g, '2'); // Replace 'z' or 'Z' with '2'
  processed = processed.replace(/[bB]/g, '8'); // Replace 'b' or 'B' with '8'
  processed = processed.replace(/[gG]/g, '9'); // Replace 'g' or 'G' with '9'
  
  // Add spaces to potential card numbers to help regex matching
  processed = processed.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/g, '$1 $2 $3 $4');
  
  return processed;
};

// Extract phone numbers from text
export const extractPhoneNumbers = (text: string): string[] => {
  const numbers = new Set<string>();
  const processedText = preprocessText(text);
  
  phoneRegexPatterns.forEach(regex => {
    const matches = processedText.match(regex);
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

// Extract credit card numbers from text
export const extractCardNumbers = (text: string): string[] => {
  const numbers = new Set<string>();
  const processedText = preprocessText(text);
  
  // First look for exact matches using regex
  cardRegexPatterns.forEach(regex => {
    const matches = processedText.match(regex);
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
  const allDigitSequences = processedText.match(/\d[\d\s-]{14,21}\d/g) || [];
  allDigitSequences.forEach(seq => {
    const cleanedSeq = cleanNumber(seq);
    const digitOnly = cleanedSeq.replace(/\D/g, '');
    if (digitOnly.length >= 13 && digitOnly.length <= 19) {
      numbers.add(cleanedSeq);
    }
  });
  
  return Array.from(numbers);
};

// Process image to extract text and then find numbers
export const extractNumbersFromImage = async (imageSrc: string): Promise<{
  phones: string[];
  cards: string[];
}> => {
  try {
    // Initialize worker properly according to Tesseract.js types
    const worker = await createWorker('ukr+eng');
    
    // Set image recognition parameters using proper types
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789 +-()ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      preserve_interword_spaces: '1',
    });
    
    console.log("Starting OCR recognition...");
    
    // Recognize text using correct Tesseract.js API
    // Progress logging is handled with a console log after status changes
    const { data } = await worker.recognize(imageSrc);
    
    // Log progress manually since we can't use the logger option
    console.log("Recognition completed");
    console.log("Recognized text:", data.text); // Log for debugging
    
    // Terminate worker
    await worker.terminate();
    
    // Extract numbers from recognized text
    const phones = extractPhoneNumbers(data.text);
    const cards = extractCardNumbers(data.text);
    
    console.log("Extracted phones:", phones);
    console.log("Extracted cards:", cards);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
