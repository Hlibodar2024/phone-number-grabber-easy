
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
    
    // КРИТИЧНІ ЗМІНИ: Спочатку шукаємо українські телефони з форматом 380
    const rawText = data.text + " " + processedText;
    let phones: string[] = [];
    let foundUkrainianNumbers = false;
    
    // Ключовий момент: навіть якщо текст містить "8 380", це гарантовано український номер
    if (rawText.includes("380") || rawText.includes("+380") || 
        rawText.match(/8\s*380/) || rawText.match(/\+?\s?380/)) {
      
      foundUkrainianNumbers = true;
      
      // Прямий пошук українських шаблонів
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
      
      ukrainianPatterns.forEach(pattern => {
        const matches = rawText.match(pattern);
        if (matches && matches.length > 0) {
          matches.forEach(match => {
            if (match) {
              // Видаляємо нецифрові символи, крім +
              let cleaned = match.replace(/[^\d+]/g, '');
              
              // Форматуємо з префіксом +380
              let formattedPhone;
              
              if (cleaned.startsWith('8380')) {
                formattedPhone = `+${cleaned.substring(1)}`;
              } else if (cleaned.match(/^1?8?380/)) {
                const digits = cleaned.match(/380(\d+)/)[1];
                formattedPhone = `+380${digits}`;
              } else if (cleaned.startsWith('380')) {
                formattedPhone = `+${cleaned}`;
              } else if (cleaned.includes('380')) {
                const index = cleaned.indexOf('380');
                formattedPhone = `+${cleaned.substring(index)}`;
              }
              
              if (formattedPhone && !phones.includes(formattedPhone)) {
                phones.push(formattedPhone);
              }
            }
          });
        }
      });
      
      // Якщо попередній підхід не допоміг, спробуємо знайти окремо "8 380"
      if (phones.length === 0) {
        const match = rawText.match(/8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/);
        if (match) {
          const cleaned = match[0].replace(/[^\d]/g, '');
          if (cleaned.startsWith('8380')) {
            const formattedPhone = `+${cleaned.substring(1)}`;
            phones.push(formattedPhone);
          }
        }
      }
      
      // Ще один шанс знайти будь-які цифри після 380
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
    }
    
    // Якщо все ще не знайшли українські номери, спробуємо загальний метод
    if (!foundUkrainianNumbers || phones.length === 0) {
      phones = extractPhoneNumbers(processedText, cleanNumber, isLikelyCardNumber);
    }
    
    // Кінцева перевірка: шукаємо картки, ЛИШЕ після того, як всі телефони належним чином ідентифіковані
    let cards = extractCardNumbers(processedText, cleanNumber);
    
    // КРИТИЧНИЙ МОМЕНТ: фільтруємо будь-які картки, які насправді є українськими номерами
    cards = cards.filter(card => {
      const digitOnly = card.replace(/\D/g, '');
      return !digitOnly.includes('380');
    });
    
    // Якщо виявлено карту з "380", переносимо її в телефони
    for (let i = cards.length - 1; i >= 0; i--) {
      const card = cards[i];
      if (card.includes('380') || card.includes('+380') || card.match(/8\s?380/)) {
        // Видаляємо з карток
        cards.splice(i, 1);
        
        // Форматуємо й додаємо до телефонів, якщо ще не додано
        let formatted = card;
        const digits = card.replace(/[^\d]/g, '');
        
        if (digits.includes('380')) {
          const index = digits.indexOf('380');
          formatted = `+${digits.substring(index)}`;
          
          if (!phones.includes(formatted)) {
            phones.push(formatted);
          }
        }
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
