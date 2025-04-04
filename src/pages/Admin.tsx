
import React, { useState } from 'react';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Admin = () => {
  const [googleAdsClientId, setGoogleAdsClientId] = useState<string>(() => 
    localStorage.getItem('googleAdsClientId') || ''
  );
  
  const [googleAdsSlot, setGoogleAdsSlot] = useState<string>(() => 
    localStorage.getItem('googleAdsSlot') || ''
  );
  
  const [customAdCode, setCustomAdCode] = useState<string>(() => 
    localStorage.getItem('customAdCode') || ''
  );
  
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = () => {
    setIsSaving(true);
    
    // Store settings in localStorage
    localStorage.setItem('googleAdsClientId', googleAdsClientId);
    localStorage.setItem('googleAdsSlot', googleAdsSlot);
    localStorage.setItem('customAdCode', customAdCode);
    
    // Simulate saving delay
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Налаштування збережено успішно');
    }, 800);
  };
  
  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/" className="mr-3">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              На головну
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-brand-blue">Адміністративна панель</h1>
        </div>
        
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Налаштування реклами Google</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientId">Google Ads Client ID</Label>
              <Input 
                id="clientId"
                placeholder="ca-pub-xxxxxxxxxxxxxxxx"
                value={googleAdsClientId}
                onChange={(e) => setGoogleAdsClientId(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Ваш ID клієнта Google AdSense</p>
            </div>
            
            <div>
              <Label htmlFor="adSlot">Ad Slot ID</Label>
              <Input 
                id="adSlot"
                placeholder="xxxxxxxxxx"
                value={googleAdsSlot}
                onChange={(e) => setGoogleAdsSlot(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">ID слоту реклами</p>
            </div>
            
            <div>
              <Label htmlFor="customCode">Користувацький код реклами</Label>
              <Textarea 
                id="customCode"
                placeholder="<script>...</script>"
                className="font-mono text-sm"
                rows={6}
                value={customAdCode}
                onChange={(e) => setCustomAdCode(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Якщо у вас є власний код реклами, вставте його тут</p>
            </div>
            
            <Button 
              className="w-full mt-6 bg-brand-blue hover:bg-brand-dark-blue"
              onClick={handleSave} 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Зберігаємо...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Зберегти налаштування
                </>
              )}
            </Button>
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Інструкція</h2>
          <div className="prose prose-sm">
            <p>Для налаштування реклами Google AdSense:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Увійдіть до свого акаунта Google AdSense</li>
              <li>Створіть новий рекламний блок</li>
              <li>Скопіюйте Client ID та Ad Slot ID з коду, який надасть Google</li>
              <li>Вставте ці значення у відповідні поля форми вище</li>
              <li>Натисніть "Зберегти налаштування"</li>
            </ol>
            <p className="mt-4 text-sm text-gray-500">
              Реклама з'явиться на сторінках додатку після збереження налаштувань.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
