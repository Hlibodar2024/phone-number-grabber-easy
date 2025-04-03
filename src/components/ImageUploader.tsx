
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageUploaded: (image: string) => void;
  isProcessing: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUploaded, isProcessing }) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      onImageUploaded(result);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play();
          resolve();
        };
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0);
      
      // Stop all video streams
      (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      
      const imageUrl = canvas.toDataURL('image/jpeg');
      setPreviewUrl(imageUrl);
      onImageUploaded(imageUrl);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Не вдалося отримати доступ до камери. Будь ласка, дозвольте доступ або використовуйте завантаження зображення.');
    }
  };

  const clearImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-4 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center gap-4">
        {previewUrl ? (
          <div className="relative w-full">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-auto rounded-md object-contain max-h-60"
            />
            <button 
              onClick={clearImage}
              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
              disabled={isProcessing}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="bg-gray-100 w-full h-40 flex items-center justify-center rounded-md border-2 border-dashed border-gray-300">
            <p className="text-gray-500">Завантажте зображення або зробіть фото</p>
          </div>
        )}

        <div className="flex gap-2 w-full">
          <Button 
            onClick={() => fileInputRef.current?.click()} 
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            <Upload className="mr-2 h-4 w-4" /> Вибрати файл
          </Button>
          
          <Button 
            onClick={handleCameraCapture} 
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            <Camera className="mr-2 h-4 w-4" /> Камера
          </Button>
        </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </Card>
  );
};

export default ImageUploader;
