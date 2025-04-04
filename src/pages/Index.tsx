
import React, { useState, useCallback } from 'react';
import { Loader2, CreditCard, Phone, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import ImageUploader from '@/components/ImageUploader';
import PhoneNumberDisplay from '@/components/PhoneNumberDisplay';
import PhoneHistory from '@/components/PhoneHistory';
import GoogleAd from '@/components/GoogleAd';
import { extractNumbersFromImage } from '@/services/phoneExtractor';
import { usePhoneHistory, NumberType } from '@/hooks/usePhoneHistory';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedPhones, setExtractedPhones] = useState<string[]>([]);
  const [extractedCards, setExtractedCards] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { history, addToHistory, clearHistory } = usePhoneHistory();
  const isMobile = useIsMobile();
  
  // Secret admin access sequence tracking
  const [adminClickCount, setAdminClickCount] = useState(0);
  const logoClickLimit = 5; // Number of clicks required to show admin button

  const handleLogoClick = useCallback(() => {
    setAdminClickCount(prevCount => {
      const newCount = prevCount + 1;
      if (newCount === logoClickLimit) {
        toast.info('Доступ до адмін-панелі розблоковано', {
          duration: 2000,
        });
      }
      return newCount;
    });
  }, []);

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
    <div className="min-h-screen bg-gray-50">
      {/* Top ad banner */}
      <GoogleAd format="horizontal" />
      
      <div className="p-4 md:p-6">
        <header className="text-center mb-6 relative">
          {adminClickCount >= logoClickLimit && (
            <div className="absolute right-0 top-0">
              <Link to="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-500 hover:text-brand-blue"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Адміністративна панель</span>
                </Button>
              </Link>
            </div>
          )}
          <h1 
            className="text-2xl font-bold text-brand-blue cursor-pointer"
            onClick={handleLogoClick}
          >
            Витягти номер телефону або картки
          </h1>
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

          {(selectedImage && isProcessing) || (extractedPhones.length > 0 || extractedCards.length > 0) ? (
            <PhoneNumberDisplay 
              phones={extractedPhones}
              cards={extractedCards}
              onSelectNumber={handleSelectNumber}
              isProcessing={isProcessing}
            />
          ) : null}

          {/* Side ad for desktop, bottom ad for mobile */}
          <div className={isMobile ? "my-4" : "hidden md:block md:absolute md:right-6 md:top-32 md:w-[300px]"}>
            <GoogleAd format={isMobile ? "rectangle" : "vertical"} />
          </div>
          
          <PhoneHistory 
            history={history} 
            onClearHistory={clearHistory}
          />
        </div>
      </div>
      
      {/* Bottom ad banner */}
      <div className="mt-8">
        <GoogleAd format="horizontal" />
      </div>
    </div>
  );
};

export default Index;
