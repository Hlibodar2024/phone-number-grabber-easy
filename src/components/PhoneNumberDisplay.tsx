
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface PhoneNumberDisplayProps {
  numbers: string[];
  onSelectNumber: (number: string) => void;
}

const PhoneNumberDisplay: React.FC<PhoneNumberDisplayProps> = ({ numbers, onSelectNumber }) => {
  const copyToClipboard = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      toast.success('Номер скопійовано');
      onSelectNumber(number);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Не вдалося скопіювати номер');
    }
  };

  const callNumber = (number: string) => {
    window.location.href = `tel:${number}`;
    onSelectNumber(number);
  };

  if (numbers.length === 0) {
    return (
      <Card className="p-4 w-full max-w-md mx-auto mt-4">
        <p className="text-center text-gray-500">Номери телефонів не знайдено</p>
      </Card>
    );
  }

  return (
    <Card className="p-4 w-full max-w-md mx-auto mt-4">
      <h3 className="text-lg font-medium mb-3">Знайдені номери:</h3>
      <div className="space-y-2">
        {numbers.map((number, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <span className="font-medium">{number}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(number)}
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
    </Card>
  );
};

export default PhoneNumberDisplay;
