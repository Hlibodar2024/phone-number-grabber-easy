
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
    
    // PRIORITY CHECK: look for Ukrainian phone number patterns
    const ukrainianPatterns = [
      /(?:\+|)380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
      /[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
      /[1\s]?[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
      /\+380\d{9}/g
    ];
    
    let phones: string[] = [];
    
    // First pass: Look specifically for Ukrainian numbers
    for (const pattern of ukrainianPatterns) {
      const matches = processedText.match(pattern) || data.text.match(pattern);
      if (matches && matches.length > 0) {
        matches.forEach(match => {
          const cleaned = cleanNumber(match);
          // Format Ukrainian numbers consistently
          let formattedPhone = cleaned;
          
          if (cleaned.includes('380')) {
            // Handle different prefixes
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
    
    // Second pass: General number extraction if no Ukrainian numbers found
    if (phones.length === 0) {
      phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
      
      // Additional search for Ukrainian numbers in raw text
      if (phones.length === 0 && (data.text.includes('380') || data.text.match(/8\s?380/))) {
        // Look for patterns that might be Ukrainian numbers
        const potentialUkrPhones = data.text.match(/[+]?[18]?[38]?[03]?80\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g);
        
        if (potentialUkrPhones) {
          potentialUkrPhones.forEach(phone => {
            const cleaned = cleanNumber(phone);
            // Format correctly
            let formattedPhone = cleaned;
            
            if (cleaned.includes('380')) {
              // Handle different prefixes
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
    }
    
    // Extract card numbers only AFTER ensuring all phone numbers are properly identified
    let cards = extractCardNumbers(processedText, cleanNumber);
    
    // Final cleanup: make sure no Ukrainian phone numbers are in cards array
    cards = cards.filter(card => {
      const digitOnly = card.replace(/\D/g, '');
      return !digitOnly.includes('380') && 
             !digitOnly.match(/8380/) &&
             !digitOnly.match(/8\s?380/);
    });
    
    // Make sure all numbers with 380 are in the phones array
    potentialNumbers.forEach(num => {
      const cleaned = cleanNumber(num);
      if (cleaned.includes('380') || cleaned.match(/8\s?380/) || cleaned.match(/8380/)) {
        // Format properly
        let formattedPhone = cleaned;
        
        if (cleaned.match(/^1\s?8\s?380/)) {
          formattedPhone = `+${cleaned.replace(/^1\s?8\s?/, '')}`;
        } else if (cleaned.match(/^8\s?380/)) {
          formattedPhone = `+${cleaned.replace(/^8\s?/, '')}`;
        } else if (cleaned.startsWith('8380')) {
          formattedPhone = `+${cleaned.substring(1)}`;
        } else if (cleaned.startsWith('380')) {
          formattedPhone = `+${cleaned}`;
        }
        
        if (!phones.includes(formattedPhone)) {
          phones.push(formattedPhone);
        }
      }
    });
    
    // Move any card numbers that look like Ukrainian phone numbers to phones array
    for (let i = cards.length - 1; i >= 0; i--) {
      const digitOnly = cards[i].replace(/\D/g, '');
      if (digitOnly.includes('380')) {
        const formattedPhone = `+${digitOnly.replace(/^8/, '')}`;
        phones.push(formattedPhone);
        cards.splice(i, 1);
      }
    }
    
    console.log("Extracted phones:", phones);
    console.log("Extracted cards:", cards);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
