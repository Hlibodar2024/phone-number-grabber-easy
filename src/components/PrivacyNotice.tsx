
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyNotice = () => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('privacyNoticeDismissed', 'true');
  };

  // Check if notice was previously dismissed
  React.useEffect(() => {
    const dismissed = localStorage.getItem('privacyNoticeDismissed') === 'true';
    if (dismissed) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-brand-blue text-white p-4 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <p className="text-sm mr-4">
          Ми не зберігаємо жодних ваших даних або зображень. 
          Усі операції відбуваються виключно у вашому браузері.
        </p>
        <Button 
          variant="ghost" 
          className="text-white hover:bg-brand-light-blue" 
          size="sm" 
          onClick={handleDismiss}
        >
          <X size={18} />
        </Button>
      </div>
    </div>
  );
};

export default PrivacyNotice;
