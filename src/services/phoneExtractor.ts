
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
  // Visa, Mastercard, etc. with spaces, dashes or no separators
  /\b(?:\d[ -]*?){13,19}\b/g,
  // 16 digits with optional spaces or dashes (4 digits groups)
  /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
  // 16 digits in a row
  /\b\d{16}\b/g
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

// Extract phone numbers from text
export const extractPhoneNumbers = (text: string): string[] => {
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

// Extract credit card numbers from text
export const extractCardNumbers = (text: string): string[] => {
  const numbers = new Set<string>();
  
  cardRegexPatterns.forEach(regex => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        const cleanedNumber = cleanNumber(match);
        if (isLikelyCardNumber(cleanedNumber)) {
          numbers.add(cleanedNumber);
        }
      });
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
    // Initialize worker
    const worker = await createWorker('ukr+eng');
    
    // Recognize text
    const { data } = await worker.recognize(imageSrc);
    
    // Terminate worker
    await worker.terminate();
    
    // Extract numbers from recognized text
    const phones = extractPhoneNumbers(data.text);
    const cards = extractCardNumbers(data.text);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
