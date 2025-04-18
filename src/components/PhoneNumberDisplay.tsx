
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Phone, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NumberType } from '@/hooks/usePhoneHistory';
import { Progress } from '@/components/ui/progress';

interface PhoneNumberDisplayProps {
  phones: string[];
  cards: string[];
  onSelectNumber: (number: string, type: NumberType) => void;
  isProcessing?: boolean;
}

const PhoneNumberDisplay: React.FC<PhoneNumberDisplayProps> = ({ 
  phones, 
  cards, 
  onSelectNumber,
  isProcessing = false
}) => {
  // Ensure any Ukrainian phone number in cards array is moved to phones
  let formattedPhones = [...phones];
  let filteredCards = [...cards];
  
  // Move any misidentified Ukrainian numbers from cards to phones
  for (let i = filteredCards.length - 1; i >= 0; i--) {
    const card = filteredCards[i];
    if (card.includes('380') || (card.match(/^8\s?380/) || card.includes('+380'))) {
      // Format and add to phones
      let formatted = card;
      if (card.match(/^8\s?380/)) {
        formatted = `+${card.replace(/^8\s?/, '')}`;
      } else if (!card.startsWith('+')) {
        const match = card.match(/380\d+/);
        if (match) {
          formatted = `+${match[0]}`;
        }
      }
      
      if (!formattedPhones.includes(formatted)) {
        formattedPhones.push(formatted);
      }
      // Remove from cards
      filteredCards.splice(i, 1);
    }
  }

  // Format phone numbers for consistent display
  formattedPhones = formattedPhones.map(phone => {
    if (phone.includes('380') && !phone.startsWith('+')) {
      if (phone.match(/^8\s?380/)) {
        return `+${phone.replace(/^8\s?/, '')}`;
      } else if (phone.startsWith('380')) {
        return `+${phone}`;
      }
    }
    return phone;
  });

  const copyToClipboard = async (number: string, type: NumberType) => {
    try {
      await navigator.clipboard.writeText(number);
      toast.success(type === NumberType.PHONE ? 'Номер скопійовано' : 'Номер картки скопійовано');
      onSelectNumber(number, type);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Не вдалося скопіювати номер');
    }
  };

  const callNumber = (number: string) => {
    window.location.href = `tel:${number}`;
    onSelectNumber(number, NumberType.PHONE);
  };

  // Show loading state
  if (isProcessing) {
    return (
      <Card className="p-4 w-full max-w-md mx-auto mt-4">
        <div className="flex flex-col items-center space-y-4 py-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand-blue" />
          <p className="text-center text-gray-700">Розпізнаємо номери...</p>
          <Progress value={50} className="w-full" />
        </div>
      </Card>
    );
  }

  // Display empty state only when not processing and no numbers
  if (formattedPhones.length === 0 && filteredCards.length === 0) {
    return (
      <Card className="p-4 w-full max-w-md mx-auto mt-4">
        <p className="text-center text-gray-500">Номери не знайдено</p>
      </Card>
    );
  }

  // Display found numbers
  return (
    <Card className="p-4 w-full max-w-md mx-auto mt-4">
      {formattedPhones.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Phone className="mr-2 h-5 w-5" /> Знайдені номери телефонів:
          </h3>
          <div className="space-y-2 mb-4">
            {formattedPhones.map((number, index) => (
              <div key={`phone-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <span className="font-medium">{number}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(number, NumberType.PHONE)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">Копіювати</span>
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => callNumber(number)}
                    className="flex items-center gap-1 bg-brand-blue hover:bg-brand-dark-blue"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">Дзвонити</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {filteredCards.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <CreditCard className="mr-2 h-5 w-5" /> Знайдені номери карток:
          </h3>
          <div className="space-y-2">
            {filteredCards.map((number, index) => (
              <div key={`card-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <span className="font-medium">{number}</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(number, NumberType.CARD)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:inline-block">Копіювати</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

export default PhoneNumberDisplay;
