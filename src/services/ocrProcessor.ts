
import { createWorker, PSM } from 'tesseract.js';
import { preprocessText, cleanNumber, extractPotentialNumbers } from './extraction/textProcessing';
import { extractPhoneNumbers } from './extraction/phonePatterns';
import { extractCardNumbers, isLikelyCardNumber } from './extraction/cardPatterns';

// Process image to extract text and then find numbers
export const extractNumbersFromImage = async (imageSrc: string): Promise<{
  phones: string[];
  cards: string[];
}> => {
  try {
    // Initialize worker with multiple languages for better recognition
    // Adding Ukrainian language first since the card in the image has Ukrainian text
    const worker = await createWorker('ukr+eng+rus');
    
    // Set recognition parameters optimized for card numbers and phone numbers
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789 +-()ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK, // Use the enum value instead of a number
    });
    
    console.log("Starting OCR recognition...");
    
    // Recognize text
    const { data } = await worker.recognize(imageSrc);
    
    console.log("Recognition completed");
    console.log("Recognized text:", data.text); // Log for debugging
    
    // Terminate worker to free resources
    await worker.terminate();
    
    // Preprocess the recognized text
    const processedText = preprocessText(data.text);
    console.log("Processed text:", processedText); // Log processed text for debugging
    
    // Extract potential numbers that might be missed by regex
    const potentialNumbers = extractPotentialNumbers(processedText);
    console.log("Potential numbers:", potentialNumbers);
    
    // FIRST PASS: Focus specifically on Ukrainian phone patterns
    let phones: string[] = [];
    const rawText = data.text + " " + processedText;
    
    // CRITICAL: Check for Ukrainian patterns first before any other processing
    // This is key to prevent misidentification as card numbers
    const ukrainianPatterns = [
      /\+?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
      /\+?380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
      /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{4}/g,
      /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
      /[\(]?8[\)]?\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
      /1\s?8\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g
    ];
    
    // Pre-check for Ukrainian numbers to avoid misclassification
    let foundUkrainianNumbers = false;
    ukrainianPatterns.forEach(pattern => {
      const matches = rawText.match(pattern);
      if (matches && matches.length > 0) {
        foundUkrainianNumbers = true;
        matches.forEach(match => {
          if (match) {
            let formattedPhone = match;
            
            // Remove any non-digits, spaces, parentheses
            let cleaned = match.replace(/[^\d+]/g, '');
            
            // Format properly with +380 prefix
            if (cleaned.startsWith('8380')) {
              formattedPhone = `+${cleaned.substring(1)}`;
            } else if (cleaned.match(/^1?8?380/)) {
              formattedPhone = `+380${cleaned.match(/380(\d+)/)[1]}`;
            } else if (cleaned.startsWith('380')) {
              formattedPhone = `+${cleaned}`;
            }
            
            if (!phones.includes(formattedPhone)) {
              phones.push(formattedPhone);
            }
          }
        });
      }
    });
    
    // SECOND PASS: More general extraction if needed
    if (!foundUkrainianNumbers) {
      phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
    }
    
    // Extract card numbers ONLY AFTER ensuring all phone numbers are properly identified
    let cards = extractCardNumbers(processedText, cleanNumber);
    
    // CRITICAL: Filter out any card numbers that are actually Ukrainian phone numbers
    cards = cards.filter(card => {
      const digitOnly = card.replace(/\D/g, '');
      return !digitOnly.includes('380');
    });
    
    console.log("Extracted phones:", phones);
    console.log("Extracted cards:", cards);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
