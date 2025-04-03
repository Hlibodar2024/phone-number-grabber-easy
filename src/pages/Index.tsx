
import React, { useState } from 'react';
import { Loader2, CreditCard, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageUploader from '@/components/ImageUploader';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay';
import PhoneHistory from '@/components/PhoneHistory';
import { extractNumbersFromImage } from '@/services/phoneExtractor';
import { usePhoneHistory, NumberType } from '@/hooks/usePhoneHistory';
import { toast } from 'sonner';

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedPhones, setExtractedPhones] = useState<string[]>([]);
  const [extractedCards, setExtractedCards] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { history, addToHistory, clearHistory } = usePhoneHistory();

  const handleImageUpload = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setExtractedPhones([]);
    setExtractedCards([]);
  };

  const processImage = async () => {
    if (!selectedImage) return;
    
    setIsProcessing(true);
    try {
      const { phones, cards } = await extractNumbersFromImage(selectedImage);
      
      // Update state with extracted numbers
      setExtractedPhones(phones);
      setExtractedCards(cards);
      
      // Show proper feedback to user
      if (phones.length === 0 && cards.length === 0) {
        toast.warning('Номери не знайдено. Спробуйте інше зображення або перевірте якість фото.');
      } else {
        const totalFound = phones.length + cards.length;
        toast.success(`Знайдено ${totalFound} номер${totalFound !== 1 ? 'ів' : ''}`);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Помилка при обробці зображення. Спробуйте ще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectNumber = (number: string, type: NumberType) => {
    addToHistory(number, type);
  };

  // Function to manually add a card or phone number
  const handleManualAdd = (number: string, type: NumberType) => {
    if (type === NumberType.CARD) {
      setExtractedCards(prev => [...prev, number]);
    } else {
      setExtractedPhones(prev => [...prev, number]);
    }
    addToHistory(number, type);
    toast.success(`${type === NumberType.CARD ? 'Номер картки' : 'Номер телефону'} додано`);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <header className="text-center mb-6">
        <h1 className="text-2xl font-bold text-brand-blue">Витягти номер телефону або картки</h1>
        <p className="text-gray-600 mt-1">
          Завантажте фото або скріншот із номером телефону або банківської картки
        </p>
      </header>

      <div className="max-w-md mx-auto space-y-4">
        <ImageUploader 
          onImageUploaded={handleImageUpload} 
          isProcessing={isProcessing}
        />
        
        {selectedImage && (
          <Button 
            className="w-full bg-brand-blue hover:bg-brand-dark-blue"
            onClick={processImage}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Обробка...
              </>
            ) : (
              <div className="flex items-center">
                <Phone className="mr-1 h-4 w-4" />
                <CreditCard className="mr-2 h-4 w-4" />
                Розпізнати номери
              </div>
            )}
          </Button>
        )}

        {((extractedPhones.length > 0 || extractedCards.length > 0) || isProcessing) && (
          <PhoneNumberDisplay 
            phones={extractedPhones}
            cards={extractedCards}
            onSelectNumber={handleSelectNumber}
          />
        )}

        <PhoneHistory 
          history={history} 
          onClearHistory={clearHistory}
        />
      </div>
    </div>
  );
};

export default Index;
