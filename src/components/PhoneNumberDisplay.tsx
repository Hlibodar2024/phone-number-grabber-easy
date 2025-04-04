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
  if (phones.length === 0 && cards.length === 0) {
    return (
      <Card className="p-4 w-full max-w-md mx-auto mt-4">
        <p className="text-center text-gray-500">Номери не знайдено</p>
      </Card>
    );
  }

  // Display found numbers
  return (
    <Card className="p-4 w-full max-w-md mx-auto mt-4">
      {phones.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Phone className="mr-2 h-5 w-5" /> Знайдені номери телефонів:
          </h3>
          <div className="space-y-2 mb-4">
            {phones.map((number, index) => (
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

      {cards.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <CreditCard className="mr-2 h-5 w-5" /> Знайдені номери карток:
          </h3>
          <div className="space-y-2">
            {cards.map((number, index) => (
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
