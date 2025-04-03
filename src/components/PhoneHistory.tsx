
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, History, Phone, Trash, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { NumberType } from '@/hooks/usePhoneHistory';

interface HistoryItem {
  number: string;
  timestamp: number;
  type: NumberType;
}

interface PhoneHistoryProps {
  history: HistoryItem[];
  onClearHistory: () => void;
}

const PhoneHistory: React.FC<PhoneHistoryProps> = ({ history, onClearHistory }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = async (number: string) => {
    try {
      await navigator.clipboard.writeText(number);
      toast.success('Номер скопійовано');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Не вдалося скопіювати номер');
    }
  };

  const callNumber = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  if (history.length === 0) {
    return null;
  }

  const displayedHistory = isExpanded ? history : history.slice(0, 3);

  return (
    <Card className="p-4 w-full max-w-md mx-auto mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium flex items-center">
          <History className="mr-2 h-5 w-5" /> Історія
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearHistory}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash className="h-4 w-4 mr-1" /> Очистити
        </Button>
      </div>
      
      <div className="space-y-2">
        {displayedHistory.map((item, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
            <div className="flex flex-col">
              <div className="font-medium flex items-center">
                {item.type === NumberType.PHONE ? (
                  <Phone className="h-4 w-4 mr-1 text-brand-blue" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-1 text-brand-blue" />
                )}
                {item.number}
              </div>
              <span className="text-xs text-gray-500">
                {format(item.timestamp, "d MMMM, HH:mm", { locale: uk })}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(item.number)}
                className="flex items-center gap-1"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {item.type === NumberType.PHONE && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => callNumber(item.number)}
                  className="flex items-center gap-1 bg-brand-blue hover:bg-brand-dark-blue"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {history.length > 3 && (
        <Button 
          variant="ghost" 
          className="w-full mt-2" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Згорнути' : 'Показати всі'}
        </Button>
      )}
    </Card>
  );
};

export default PhoneHistory;
