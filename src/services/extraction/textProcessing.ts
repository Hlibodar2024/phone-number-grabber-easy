
// Clean up the extracted number
export const cleanNumber = (number: string): string => {
  return number.replace(/\s+/g, ' ').trim();
};

// Advanced preprocessing of text before extraction
export const preprocessText = (text: string): string => {
  // Replace common OCR mistakes in card numbers
  let processed = text;
  
  // Improve OCR mistake handling for credit cards
  processed = processed.replace(/[oO]/g, '0'); // Replace 'o' or 'O' with '0'
  processed = processed.replace(/[iIlL]/g, '1'); // Replace 'i', 'I', 'l', 'L' with '1'
  processed = processed.replace(/[zZ]/g, '2'); // Replace 'z' or 'Z' with '2'
  processed = processed.replace(/[bB]/g, '8'); // Replace 'b' or 'B' with '8'
  processed = processed.replace(/[gG]/g, '9'); // Replace 'g' or 'G' with '9'
  processed = processed.replace(/[sS5]/g, '5'); // Replace 's' or 'S' with '5'
  processed = processed.replace(/[tT]/g, '7'); // Replace 't' or 'T' with '7'
  
  // Normalize spacing in potential card numbers to help regex matching
  processed = processed.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/g, '$1 $2 $3 $4');
  
  // Remove non-alphanumeric characters except spaces
  processed = processed.replace(/[^\w\s]/g, '');
  
  // Replace multiple spaces with a single space
  processed = processed.replace(/\s+/g, ' ');
  
  return processed;
};

// Extract potential numbers from low-quality text
export const extractPotentialNumbers = (text: string): string[] => {
  // Find all digit sequences (4 or more digits)
  const digitGroups = text.match(/\d{4,}/g) || [];
  
  // Group digits into potential card number chunks (for fragmented OCR readings)
  const potentialNumbers: string[] = [];
  
  // Process each group of digits
  digitGroups.forEach(group => {
    if (group.length >= 14) {
      // Format potentially as a card number
      let formattedGroup = group;
      if (group.length === 16) {
        formattedGroup = group.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
      }
      potentialNumbers.push(formattedGroup);
    }
  });
  
  return potentialNumbers;
};
