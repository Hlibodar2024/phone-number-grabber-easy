
// Configure phone number regular expressions for different formats
export const phoneRegexPatterns = [
  // Український формат найвищої пріоритетності
  /\+380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  
  // Критичні українські формати "8 380"
  /[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  /380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  /[8\s]+[+]?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
  /[8\s]+380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  
  // Критичний формат: 8 380 - це завжди український номер
  /8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g,
  
  // Формати, які з великою ймовірністю є українськими номерами
  /[1\s]?[8\s]?380[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  
  // Формати з дужками
  /\(?[8\s]?380\)?[-\s]?\d{2}[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  
  // Міжнародні формати
  /\+\d{1,3}[-\s]?\(?\d{1,4}\)?[-\s]?\d{1,4}[-\s]?\d{1,9}/g,
  
  // Базові формати номерів з роздільниками
  /\(?0\d{2}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}/g,
  /\(?0\d{2}\)?[-\s]?\d{3}[-\s]?\d{4}/g,
  
  // Прості послідовності цифр, які можуть бути номерами телефонів (9+ цифр)
  /\d{9,}/g,
  
  // Додаткові українські шаблони для прямого виявлення
  /8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g,
  /8\s*\+?380\s*\d{2}\s*\d{3}\s*\d{4}/g,
  /\(?8\)?\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g
];

// Перевірка, чи відповідає номер форматам номера телефону
export const isLikelyPhoneNumber = (number: string): boolean => {
  // КРИТИЧНО: БУДЬ-яка послідовність з 380 повинна вважатися українським номером телефону
  if (number.includes('380') || number.includes('8 380') || number.match(/8\s*380/)) {
    console.log("Знайдено український номер за шаблоном 380 або 8 380");
    return true;
  }
  
  // Видаляємо всі нецифрові символи, окрім + для міжнародного префіксу
  const cleaned = number.replace(/[^\d+]/g, '');
  
  // Перевірка на типову довжину номера телефону
  if (cleaned.length < 10 || cleaned.length > 15) return false;
  
  // Перевірка на поширені шаблони номерів телефонів
  if (cleaned.startsWith('+')) return true;
  if (cleaned.startsWith('0')) return true;
  
  return false;
};

// Витягнути номери телефонів з тексту
export const extractPhoneNumbers = (text: string, cleanNumber: (number: string) => string, isLikelyCardNumber: (number: string) => boolean): string[] => {
  const numbers = new Set<string>();
  
  // Спочатку шукаємо українські шаблони в необробленому тексті
  const directUkrainianPatterns = [
    /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    /[8\s]+[+]?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    /[8\s]+380\s?\d{2}\s?\d{3}\s?\d{2}\s?\d{2}/g,
    /[\(]?8[\)]?\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    // Критичний шаблон: формат 8 380
    /8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g,
    // Інший критичний формат
    /1\s?8\s?380\s?\d{2}\s?\d{3}\s?\d{4}/g,
    // Додаткові комбінації
    /8\s*\+?380\s*\d{2}\s*\d{3}\s*\d{4}/g,
    /\(?8\)?\s*380\s*\d{2}\s*\d{3}\s*\d{4}/g,
    /8\s*380\s*\d{2}\s*\d{3}\s*\d{2}\s*\d{2}/g
  ];
  
  for (const pattern of directUkrainianPatterns) {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Форматуємо українські номери послідовно з префіксом +380
        const digits = match.replace(/[^\d]/g, '');
        if (digits.includes('380')) {
          // Витягуємо частину, що починається з 380
          const index = digits.indexOf('380');
          let formattedNumber = `+${digits.substring(index)}`;
          numbers.add(formattedNumber);
          console.log("Додано український номер з шаблону:", formattedNumber);
        }
      });
    }
  }
  
  // Якщо не знайдено українських номерів через прямі шаблони, спробуйте стандартні шаблони
  if (numbers.size === 0) {
    // Додаткова перевірка для 8 380
    const specificMatch = text.match(/8\s*380\s*\d{2}\s*\d{3}\s*\d{4}/);
    if (specificMatch) {
      const digits = specificMatch[0].replace(/[^\d]/g, '');
      if (digits.includes('380')) {
        // Витягуємо частину, що починається з 380
        const index = digits.indexOf('380');
        let formattedNumber = `+${digits.substring(index)}`;
        numbers.add(formattedNumber);
        console.log("Додано 8 380 номер через спеціальну перевірку:", formattedNumber);
      }
    } else {
      phoneRegexPatterns.forEach(regex => {
        const matches = text.match(regex);
        if (matches) {
          matches.forEach(match => {
            const cleanedNumber = cleanNumber(match);
            
            // Українські номери ніколи не повинні класифікуватися як картки
            if (cleanedNumber.includes('380') || match.match(/8\s*380/)) {
              const digits = cleanedNumber.replace(/[^\d]/g, '');
              if (digits.includes('380')) {
                const index = digits.indexOf('380');
                const formattedNumber = `+${digits.substring(index)}`;
                numbers.add(formattedNumber);
                console.log("Додано український номер зі стандартного шаблону:", formattedNumber);
              } else {
                numbers.add(cleanedNumber);
              }
              return;
            }
            
            // Пропускаємо, якщо це, ймовірно, номер картки і не містить 380
            if (isLikelyCardNumber(cleanedNumber) && !cleanedNumber.includes('380')) {
              return;
            }
            
            // Форматуємо українські номери послідовно
            let formattedNumber = cleanedNumber;
            const digits = cleanedNumber.replace(/[^\d]/g, '');
            
            if (digits.includes('380')) {
              const index = digits.indexOf('380');
              formattedNumber = `+${digits.substring(index)}`;
              console.log("Додано відформатований український номер:", formattedNumber);
            } else if (isLikelyPhoneNumber(cleanedNumber)) {
              formattedNumber = cleanedNumber;
            }
            
            numbers.add(formattedNumber);
          });
        }
      });
    }
  }
  
  return Array.from(numbers);
};
