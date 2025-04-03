
import { createWorker } from 'tesseract.js';
import { preprocessText, cleanNumber } from './extraction/textProcessing';
import { extractPhoneNumbers } from './extraction/phonePatterns';
import { extractCardNumbers, isLikelyCardNumber } from './extraction/cardPatterns';

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
    
    // Preprocess the recognized text
    const processedText = preprocessText(data.text);
    
    // Extract numbers from processed text
    const phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
    const cards = extractCardNumbers(processedText, cleanNumber);
    
    console.log("Extracted phones:", phones);
    console.log("Extracted cards:", cards);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
