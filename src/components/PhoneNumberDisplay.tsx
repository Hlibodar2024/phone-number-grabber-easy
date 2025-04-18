
import React, { useEffect, useState } from 'react';
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
  const [displayPhones, setDisplayPhones] = useState<string[]>([]);
  const [displayCards, setDisplayCards] = useState<string[]>([]);
  
  // Очищення та рекласифікація номерів при завантаженні компонента чи зміні пропсів
  useEffect(() => {
    // Спочатку перевіримо наявність номерів з "380" серед карткових номерів
    let newPhones = [...phones];
    let newCards = [...cards].filter(card => {
      const digitOnly = card.replace(/\D/g, '');
      
      // Якщо номер картки містить "380", переміщуємо його до телефонів
      if (digitOnly.includes('380')) {
        let formattedNumber;
        // Витяг номера телефону з "380"
        const index = digitOnly.indexOf('380');
        formattedNumber = `+${digitOnly.substring(index)}`;
        
        // Додавання до телефонів
        if (!newPhones.includes(formattedNumber)) {
          newPhones.push(formattedNumber);
        }
        
        // Видаляємо з карток
        return false;
      }
      return true;
    });
    
    // Переконуємося, що всі номери телефонів правильно відформатовані
    newPhones = newPhones.map(phone => {
      const digitOnly = phone.replace(/\D/g, '');
      if (digitOnly.includes('380')) {
        const index = digitOnly.indexOf('380');
        return `+${digitOnly.substring(index)}`;
      }
      return phone;
    });
    
    setDisplayPhones(newPhones);
    setDisplayCards(newCards);
  }, [phones, cards]);

  // Копіювання в буфер обміну
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

  // Функція дзвінка
  const callNumber = (number: string) => {
    window.location.href = `tel:${number}`;
    onSelectNumber(number, NumberType.PHONE);
  };

  // Стан завантаження
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

  // Пустий стан
  if (displayPhones.length === 0 && displayCards.length === 0) {
    return (
      <Card className="p-4 w-full max-w-md mx-auto mt-4">
        <p className="text-center text-gray-500">Номери не знайдено</p>
      </Card>
    );
  }

  // Відображення знайдених номерів
  return (
    <Card className="p-4 w-full max-w-md mx-auto mt-4">
      {displayPhones.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <Phone className="mr-2 h-5 w-5" /> Знайдені номери телефонів:
          </h3>
          <div className="space-y-2 mb-4">
            {displayPhones.map((number, index) => (
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

      {displayCards.length > 0 && (
        <>
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <CreditCard className="mr-2 h-5 w-5" /> Знайдені номери карток:
          </h3>
          <div className="space-y-2">
            {displayCards.map((number, index) => (
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
