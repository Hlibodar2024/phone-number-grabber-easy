
import { extractNumbersFromImage } from './ocrProcessor';
import { extractPhoneNumbers } from './extraction/phonePatterns';
import { extractCardNumbers } from './extraction/cardPatterns';
import { preprocessText, cleanNumber } from './extraction/textProcessing';
import { isLikelyCardNumber } from './extraction/cardPatterns';

// Re-export the functions needed by the application
export { 
  extractNumbersFromImage,
  extractPhoneNumbers,
  extractCardNumbers
};
