
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
    
    // FIRST PASS: Focus on finding any Ukrainian phone number patterns
    let phones: string[] = [];
    let rawText = data.text + " " + processedText;
    
    // Specifically look for "8 380" patterns as these are commonly misidentified
    const ukrainianPatterns = [
      /[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
      /[1\s]?[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
    ];
    
    for (const pattern of ukrainianPatterns) {
      const matches = rawText.match(pattern);
      if (matches && matches.length > 0) {
        matches.forEach(match => {
          const cleaned = cleanNumber(match);
          // Format Ukrainian numbers consistently
          let formattedPhone = cleaned;
          
          if (cleaned.includes('380')) {
            if (cleaned.match(/^1\s?8\s?380/)) {
              // Fix "1 8 380" format (OCR mistake)
              formattedPhone = `+${cleaned.replace(/^1\s?8\s?/, '')}`;
            } else if (cleaned.match(/^8\s?380/)) {
              // Handle "8 380" format
              formattedPhone = `+${cleaned.replace(/^8\s?/, '')}`;
            } else if (cleaned.startsWith('8380')) {
              formattedPhone = `+${cleaned.substring(1)}`;
            } else if (cleaned.startsWith('380')) {
              formattedPhone = `+${cleaned}`;
            }
          }
          
          if (!phones.includes(formattedPhone)) {
            phones.push(formattedPhone);
          }
        });
      }
    }
    
    // SECOND PASS: General phone number extraction if first pass didn't find anything
    if (phones.length === 0) {
      phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
    }
    
    // Extract card numbers only AFTER ensuring all phone numbers are properly identified
    let cards = extractCardNumbers(processedText, cleanNumber);
    
    // Check if any card numbers are actually Ukrainian phone numbers
    for (let i = cards.length - 1; i >= 0; i--) {
      const digitOnly = cards[i].replace(/\D/g, '');
      // If the card number contains 380, it's likely a Ukrainian phone number
      if (digitOnly.includes('380')) {
        let formattedPhone;
        if (digitOnly.startsWith('8380')) {
          formattedPhone = `+${digitOnly.substring(1)}`;
        } else if (digitOnly.startsWith('380')) {
          formattedPhone = `+${digitOnly}`;
        } else if (cards[i].match(/^8\s?380/)) {
          formattedPhone = `+${cards[i].replace(/^8\s?/, '')}`;
        } else if (cards[i].match(/^1\s?8\s?380/)) {
          formattedPhone = `+${cards[i].replace(/^1\s?8\s?/, '')}`;
        } else {
          // Handle case where 380 is in the middle
          const index = digitOnly.indexOf('380');
          if (index >= 0) {
            formattedPhone = `+${digitOnly.substring(index)}`;
          }
        }
        
        if (formattedPhone && !phones.includes(formattedPhone)) {
          phones.push(formattedPhone);
        }
        cards.splice(i, 1); // Remove from cards array
      }
    }
    
    // Final dedupe and cleanup
    phones = [...new Set(phones)];
    cards = [...new Set(cards)];
    
    console.log("Extracted phones:", phones);
    console.log("Extracted cards:", cards);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
