
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
    console.log("Image source:", imageSrc.substring(0, 50) + "..."); // Log image source for debugging
    
    // Recognize text
    const { data } = await worker.recognize(imageSrc);
    
    console.log("Recognition completed");
    console.log("Raw recognized text:", data.text);
    console.log("Text length:", data.text.length);
    console.log("Contains digits:", /\d/.test(data.text));
    
    // Terminate worker to free resources
    await worker.terminate();
    
    // Preprocess the recognized text
    const processedText = preprocessText(data.text);
    console.log("Processed text:", processedText);
    
    // Debug: look for card number patterns specifically
    const cardPatterns = [
      /5355\s*2800\s*1579\s*0706/i,
      /5\d{3}\s*\d{4}\s*\d{4}\s*\d{4}/g,
      /\d{4}\s*\d{4}\s*\d{4}\s*\d{4}/g
    ];
    
    console.log("Checking for card patterns:");
    cardPatterns.forEach((pattern, index) => {
      const matches = data.text.match(pattern) || processedText.match(pattern);
      console.log(`Pattern ${index + 1}:`, matches);
    });
    
    // Це критично важлива додаткова перевірка для комбінації "8 380"
    if (data.text.match(/[8\s]+380\s?\d{2}\s?\d{3}\s?\d{4}/) || 
        data.text.match(/8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/)) {
      console.log("Знайдено український номер у форматі 8 380");
      
      // Знаходимо номер телефону за шаблоном "8 380"
      const matches = data.text.match(/8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g) || [];
      
      if (matches.length > 0) {
        const phones = matches.map(match => {
          // Перетворюємо в формат +380
          const digits = match.replace(/[^\d]/g, '');
          // Якщо починається з 8380, видаляємо першу 8
          if (digits.startsWith('8380')) {
            return `+${digits.substring(1)}`;
          }
          return `+${digits.substring(digits.indexOf('380'))}`;
        });
        
        // НЕ шукаємо картки, якщо знайдено український номер телефону
        return { phones, cards: [] };
      }
    }
    
    // Додаткова перевірка на "+380"
    if (data.text.includes("+380") || processedText.includes("+380")) {
      console.log("Знайдено прямий український номер з +380");
      
      const matches = data.text.match(/\+380\s*\d{2}\s*\d{3}\s*\d{4}/g) || 
                      processedText.match(/\+380\s*\d{2}\s*\d{3}\s*\d{4}/g) || [];
      
      if (matches.length > 0) {
        const phones = matches.map(match => {
          const digits = match.replace(/[^\d+]/g, '');
          return digits;
        });
        
        // НЕ шукаємо картки, якщо знайдено український номер телефону
        return { phones, cards: [] };
      }
    }
    
    // Extract potential numbers that might be missed by regex
    const potentialNumbers = extractPotentialNumbers(processedText);
    console.log("Potential numbers:", potentialNumbers);
    
    // Перевіряємо потенційні номери на наявність послідовності "380"
    for (const num of potentialNumbers) {
      if (num.includes('380')) {
        const cleanNum = num.replace(/[^\d]/g, '');
        const index = cleanNum.indexOf('380');
        if (index >= 0) {
          return { 
            phones: [`+${cleanNum.substring(index)}`], 
            cards: [] 
          };
        }
      }
    }
    
    // Обробляємо весь текст для пошуку українських номерів
    const rawText = data.text + " " + processedText;
    if (rawText.includes("380") || rawText.match(/8\s*380/)) {
      // Шаблони для українських номерів
      const ukrainianPatterns = [
        /\+?\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
        /\+?\s?380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
        /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{4}/g,
        /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
        /[\(]?8[\)]?\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
        /8\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g
      ];
      
      let phones: string[] = [];
      
      // Перевіряємо всі шаблони
      for (const pattern of ukrainianPatterns) {
        const matches = rawText.match(pattern);
        if (matches && matches.length > 0) {
          matches.forEach(match => {
            // Формуємо номер
            const digits = match.replace(/[^\d]/g, '');
            if (digits.includes('380')) {
              const index = digits.indexOf('380');
              const formattedPhone = `+${digits.substring(index)}`;
              if (!phones.includes(formattedPhone)) {
                phones.push(formattedPhone);
              }
            }
          });
        }
      }
      
      if (phones.length > 0) {
        return { phones, cards: [] };
      }
    }
    
    // Якщо не знайдено українських номерів через спеціальні шаблони, 
    // спробуйте стандартні функції вилучення
    const phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
    let cards: string[] = [];
    
    // Перевіряємо, чи не містять номери телефонів шаблон "380"
    if (phones.some(phone => phone.includes('380'))) {
      // Якщо хоч один телефон містить "380", не шукаємо картки
      cards = [];
    } else {
      // Тільки якщо жоден телефон не містить "380", шукаємо картки
      cards = extractCardNumbers(processedText, cleanNumber);
    }
    
    console.log("Extracted phones:", phones);
    console.log("Extracted cards:", cards);
    
    return { phones, cards };
  } catch (error) {
    console.error('Error extracting numbers:', error);
    return { phones: [], cards: [] };
  }
};
