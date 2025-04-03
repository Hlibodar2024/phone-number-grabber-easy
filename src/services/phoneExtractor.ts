
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

// Clean up the extracted phone number
const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/\s+/g, ' ').trim();
};

// Extract phone numbers from text
export const extractPhoneNumbers = (text: string): string[] => {
  const numbers = new Set<string>();
  
  phoneRegexPatterns.forEach(regex => {
    const matches = text.match(regex);
    if (matches) {
      matches.forEach(match => {
        numbers.add(cleanPhoneNumber(match));
      });
    }
  });
  
  return Array.from(numbers);
};

// Process image to extract text and then find phone numbers
export const extractPhoneNumbersFromImage = async (imageSrc: string): Promise<string[]> => {
  try {
    // Initialize worker
    const worker = await createWorker('ukr+eng');
    
    // Recognize text
    const { data } = await worker.recognize(imageSrc);
    
    // Terminate worker
    await worker.terminate();
    
    // Extract phone numbers from recognized text
    return extractPhoneNumbers(data.text);
  } catch (error) {
    console.error('Error extracting phone numbers:', error);
    return [];
  }
};
