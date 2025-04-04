
import React, { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GoogleAdProps {
  format?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  slot?: string;
}

const GoogleAd: React.FC<GoogleAdProps> = ({ format = 'auto', slot }) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const clientId = localStorage.getItem('googleAdsClientId');
    const adSlot = slot || localStorage.getItem('googleAdsSlot');
    const customCode = localStorage.getItem('customAdCode');
    
    // Load custom ad code if it exists
    if (customCode && adRef.current) {
      adRef.current.innerHTML = customCode;
      const scripts = adRef.current.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        Array.from(script.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.appendChild(document.createTextNode(script.innerHTML));
        script.parentNode?.replaceChild(newScript, script);
      });
      return;
    }
    
    // Only load Google Ads if we have clientId and adSlot
    if (clientId && adSlot && adRef.current) {
      try {
        if (!(window as any).adsbygoogle) {
          const script = document.createElement('script');
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
          script.async = true;
          script.crossOrigin = "anonymous";
          document.head.appendChild(script);
        }
        
        // Create the ad
        const adElement = document.createElement('ins');
        adElement.className = 'adsbygoogle';
        adElement.style.display = 'block';
        adElement.style.textAlign = 'center';
        
        // Set attributes based on format and device
        if (format === 'auto') {
          adElement.setAttribute('data-ad-format', 'auto');
          adElement.setAttribute('data-full-width-responsive', 'true');
        } else {
          const sizeMap: Record<string, string> = {
            horizontal: isMobile ? '320x50' : '728x90',
            vertical: '160x600',
            rectangle: '300x250'
          };
          adElement.style.width = sizeMap[format].split('x')[0] + 'px';
          adElement.style.height = sizeMap[format].split('x')[1] + 'px';
        }
        
        adElement.setAttribute('data-ad-client', clientId);
        adElement.setAttribute('data-ad-slot', adSlot);
        
        // Add to DOM
        adRef.current.innerHTML = '';
        adRef.current.appendChild(adElement);
        
        // Push ad for display
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (err) {
        console.error("Error setting up Google Ads:", err);
      }
    }
  }, [format, slot, isMobile]);

  return (
    <div ref={adRef} className="w-full my-4 overflow-hidden text-center">
      {/* Ad will be inserted here */}
    </div>
  );
};

export default GoogleAd;
