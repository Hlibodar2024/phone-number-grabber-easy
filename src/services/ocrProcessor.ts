
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
    
    // HIGH PRIORITY: Direct matching for "8 380" and similar Ukrainian patterns
    const directUkrainianMatches = [
      ...rawText.matchAll(/[8\s]?[+]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g),
      ...rawText.matchAll(/\(?[8\s]?380\)?[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g)
    ];
    
    if (directUkrainianMatches && directUkrainianMatches.length > 0) {
      directUkrainianMatches.forEach(matchArray => {
        const match = matchArray[0];
        if (match) {
          const cleaned = cleanNumber(match);
          let formattedPhone = cleaned;
          
          // Format Ukrainian numbers consistently with +380 prefix
          if (cleaned.includes('380')) {
            if (cleaned.match(/^1\s?8\s?380/)) {
              formattedPhone = `+${cleaned.replace(/^1\s?8\s?/, '')}`;
            } else if (cleaned.match(/^8\s?380/)) {
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
        }
      });
    }
    
    // SECOND PASS: General phone number extraction if first pass didn't find anything
    if (phones.length === 0) {
      phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
    }
    
    // Extract card numbers AFTER ensuring all phone numbers are properly identified
    let cards = extractCardNumbers(processedText, cleanNumber);
    
    // CRITICAL: Filter out any card numbers that are actually Ukrainian phone numbers
    cards = cards.filter(card => {
      const digitOnly = card.replace(/\D/g, '');
      // If it contains 380, it's a Ukrainian phone number, not a card
      return !digitOnly.includes('380');
    });
    
    // Move any misidentified Ukrainian phone numbers from cards to phones
    for (let i = cards.length - 1; i >= 0; i--) {
      const card = cards[i];
      const digitOnly = card.replace(/\D/g, '');
      
      // Check for Ukrainian phone number patterns
      if (digitOnly.includes('380') || 
          card.includes('380') ||
          card.match(/^8\s?380/) ||
          card.match(/^1\s?8\s?380/)) {
        
        let formattedPhone;
        if (card.match(/^1\s?8\s?380/)) {
          formattedPhone = `+${card.replace(/^1\s?8\s?/, '')}`;
        } else if (card.match(/^8\s?380/)) {
          formattedPhone = `+${card.replace(/^8\s?/, '')}`;
        } else if (digitOnly.startsWith('8380')) {
          formattedPhone = `+${digitOnly.substring(1)}`;
        } else if (digitOnly.startsWith('380')) {
          formattedPhone = `+${digitOnly}`;
        } else if (digitOnly.includes('380')) {
          // Extract the part starting with 380
          const index = digitOnly.indexOf('380');
          formattedPhone = `+${digitOnly.substring(index)}`;
        }
        
        if (formattedPhone && !phones.includes(formattedPhone)) {
          phones.push(formattedPhone);
        }
        
        // Remove from cards array
        cards.splice(i, 1);
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
