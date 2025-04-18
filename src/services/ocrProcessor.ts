
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
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
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
    
    // ALL TEXTS THAT HAVE "380" OR "8 380" MUST BE PRIMARILY CLASSIFIED AS PHONES, NEVER CARDS
    // This is critically important - Ukrainian numbers must be properly identified first
    const rawText = data.text + " " + processedText;
    let phones: string[] = [];
    
    // FIRST PASS: Look explicitly for Ukrainian phone numbers and prioritize them
    if (rawText.includes("380") || rawText.includes("+380") || 
        rawText.match(/8\s*380/) || rawText.match(/\+?\s?380/)) {
      
      // All these patterns are guaranteed to be Ukrainian phone numbers
      const ukrainianPatterns = [
        /\+?\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
        /\+?\s?380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
        /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{4}/g,
        /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
        /[\(]?8[\)]?\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
        /1\s?8\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
        /\(?8\)?\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
        /8\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g
      ];
      
      // PRIORITY: Check for actual patterns first
      for (const pattern of ukrainianPatterns) {
        const matches = rawText.match(pattern);
        if (matches && matches.length > 0) {
          matches.forEach(match => {
            if (match) {
              // Format properly with +380 prefix
              const digits = match.replace(/[^\d]/g, '');
              let formattedPhone;
              
              if (digits.includes('380')) {
                const index = digits.indexOf('380');
                formattedPhone = `+${digits.substring(index)}`;
                
                if (formattedPhone && !phones.includes(formattedPhone)) {
                  phones.push(formattedPhone);
                }
              }
            }
          });
        }
      }
      
      // If no phones found yet but we know there's "380" somewhere, look harder
      if (phones.length === 0) {
        // Look for "8 380" format specifically
        const match = rawText.match(/8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/);
        if (match) {
          const cleaned = match[0].replace(/[^\d]/g, '');
          if (cleaned.startsWith('8380')) {
            const formattedPhone = `+${cleaned.substring(1)}`;
            phones.push(formattedPhone);
          }
        }
      }
      
      // Last resort: find any digits following 380
      if (phones.length === 0) {
        const pattern = /380\s*\d{2}\s*\d{3}\s*\d{4}/g;
        const matches = rawText.match(pattern);
        if (matches && matches.length > 0) {
          matches.forEach(match => {
            const cleaned = match.replace(/[^\d]/g, '');
            if (cleaned.startsWith('380')) {
              const formattedPhone = `+${cleaned}`;
              if (!phones.includes(formattedPhone)) {
                phones.push(formattedPhone);
              }
            }
          });
        }
      }
      
      // ABSOLUTE LAST RESORT: If we found "380" but still no phone,
      // check for any sequence that might be a phone
      if (phones.length === 0) {
        const digitSequences = rawText.match(/\d{8,}/g) || [];
        for (const seq of digitSequences) {
          if (seq.includes('380')) {
            const index = seq.indexOf('380');
            const formattedPhone = `+${seq.substring(index)}`;
            phones.push(formattedPhone);
          }
        }
      }
    }
    
    // If we still haven't found Ukrainian phones through direct patterns, try regular extraction
    if (phones.length === 0) {
      phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
    }
    
    // Only look for cards now, AFTER ensuring all Ukrainian numbers are identified as phones
    // AND filter all card candidates to ensure they don't contain 380
    let cards = [];
    
    // Only extract card numbers if we're sure there are no Ukrainian phones misclassified
    if (!rawText.includes("380") && !rawText.match(/8\s*380/)) {
      cards = extractCardNumbers(processedText, cleanNumber);
    }
    
    // Final filtering to ensure NO Ukrainian phone is misclassified as a card
    cards = cards.filter(card => {
      const digits = card.replace(/\D/g, '');
      return !digits.includes('380') && !card.match(/8\s*380/);
    });
    
    console.log("Extracted phones:", phones);
    console.log("Extracted cards:", cards);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
