
// Clean up the extracted number
export const cleanNumber = (number: string): string => {
  return number.replace(/\s+/g, ' ').trim();
};

// Advanced preprocessing of text before extraction
export const preprocessText = (text: string): string => {
  // Replace common OCR mistakes in card numbers
  let processed = text;
  processed = processed.replace(/[oO]/g, '0'); // Replace 'o' or 'O' with '0'
  processed = processed.replace(/[iIlL]/g, '1'); // Replace 'i', 'I', 'l', 'L' with '1'
  processed = processed.replace(/[zZ]/g, '2'); // Replace 'z' or 'Z' with '2'
  processed = processed.replace(/[bB]/g, '8'); // Replace 'b' or 'B' with '8'
  processed = processed.replace(/[gG]/g, '9'); // Replace 'g' or 'G' with '9'
  
  // Add spaces to potential card numbers to help regex matching
  processed = processed.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/g, '$1 $2 $3 $4');
  
  return processed;
};
