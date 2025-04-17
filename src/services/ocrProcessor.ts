
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
      tessedit_ocr_engine_mode: '2', // Use neural network LSTM engine
      tessjs_create_hocr: '0', // We don't need HOCR output
      tessjs_create_tsv: '0',  // We don't need TSV output
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
    
    // Look for Ukrainian phone number patterns specifically
    let phones: string[] = [];
    let cards: string[] = [];
    
    // Check for Ukrainian phone number patterns like +380 xx xxx xxxx
    const ukrainianPhonePatterns = [
      /(?:\+|)380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
      /\+380\d{9}/g
    ];
    
    ukrainianPhonePatterns.forEach(pattern => {
      const matches = processedText.match(pattern) || data.text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const cleaned = cleanNumber(match);
          // Ensure proper format for Ukrainian numbers
          if (!cleaned.startsWith('+')) {
            if (cleaned.startsWith('380')) {
              phones.push(`+${cleaned}`);
            } else if (cleaned.startsWith('8380')) {
              phones.push(`+${cleaned.substring(1)}`);
            } else {
              phones.push(`+380${cleaned.replace(/^\D*(\d{2}).*$/, '$1')}`);
            }
          } else {
            phones.push(cleaned);
          }
        });
      }
    });
    
    // If no Ukrainian phones found, check for generic patterns
    if (phones.length === 0) {
      phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
      
      // Special case for Ukrainian phone numbers that were misrecognized
      if (phones.length === 0) {
        // Check if there's anything that remotely looks like a Ukrainian number
        if (processedText.includes('380') || data.text.includes('380')) {
          const potentialUkrainianNumber = processedText.match(/[+]?[38]?[03]?80\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g) || 
                                         data.text.match(/[+]?[38]?[03]?80\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g);
          
          if (potentialUkrainianNumber) {
            potentialUkrainianNumber.forEach(number => {
              const cleaned = cleanNumber(number);
              if (cleaned.includes('380')) {
                if (cleaned.startsWith('8380')) {
                  phones.push(`+${cleaned.substring(1)}`);
                } else if (cleaned.startsWith('380')) {
                  phones.push(`+${cleaned}`);
                } else {
                  phones.push(`+380${cleaned.replace(/^\D*(\d{2}).*$/, '$1')}`);
                }
              }
            });
          }
        }
      }
    }
    
    // Extract card numbers only after ensuring phone numbers are properly identified
    cards = extractCardNumbers(processedText, cleanNumber);
    
    // Post-processing: make sure Ukrainian phone numbers are not classified as cards
    cards = cards.filter(card => {
      const digitOnly = card.replace(/\D/g, '');
      return !digitOnly.includes('380') && !digitOnly.startsWith('380');
    });
    
    // Final check: Ensure 380 numbers are correctly formatted as phones
    potentialNumbers.forEach(num => {
      if (num.includes('380') || num.startsWith('380')) {
        const cleaned = cleanNumber(num);
        const formattedPhone = cleaned.startsWith('+') ? cleaned : 
                              cleaned.startsWith('380') ? `+${cleaned}` : 
                              `+380${cleaned.replace(/^\D*(\d{2}).*$/, '$1')}`;
        
        if (!phones.includes(formattedPhone)) {
          phones.push(formattedPhone);
        }
      }
    });
    
    console.log("Extracted phones:", phones);
    console.log("Extracted cards:", cards);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
