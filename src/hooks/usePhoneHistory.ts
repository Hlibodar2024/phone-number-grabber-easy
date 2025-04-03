
import { useState, useEffect } from 'react';

export enum NumberType {
  PHONE = 'phone',
  CARD = 'card'
}

interface HistoryItem {
  number: string;
  timestamp: number;
  type: NumberType;
}

export const usePhoneHistory = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

  // Add a new number to history
  const addToHistory = (number: string, type: NumberType) => {
    setHistory(prev => {
      // Check if number already exists in history
      const exists = prev.some(item => item.number === number && item.type === type);
      if (exists) {
        // Move it to the top if it exists
        return [
          { number, timestamp: Date.now(), type },
          ...prev.filter(item => !(item.number === number && item.type === type))
        ];
      } else {
        // Add it as new if it doesn't exist
        return [
          { number, timestamp: Date.now(), type },
          ...prev
        ].slice(0, 30); // Keep only last 30 items
      }
    });
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
  };

  return { history, addToHistory, clearHistory };
};
