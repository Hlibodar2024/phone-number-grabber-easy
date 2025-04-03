
import { useState, useEffect } from 'react';

interface PhoneHistoryItem {
  number: string;
  timestamp: number;
}

export const usePhoneHistory = () => {
  const [history, setHistory] = useState<PhoneHistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('phoneHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading phone history:', error);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('phoneHistory', JSON.stringify(history));
  }, [history]);

  // Add a new phone number to history
  const addToHistory = (number: string) => {
    setHistory(prev => {
      // Check if number already exists in history
      const exists = prev.some(item => item.number === number);
      if (exists) {
        // Move it to the top if it exists
        return [
          { number, timestamp: Date.now() },
          ...prev.filter(item => item.number !== number)
        ];
      } else {
        // Add it as new if it doesn't exist
        return [
          { number, timestamp: Date.now() },
          ...prev
        ].slice(0, 20); // Keep only last 20 items
      }
    });
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
  };

  return { history, addToHistory, clearHistory };
};
