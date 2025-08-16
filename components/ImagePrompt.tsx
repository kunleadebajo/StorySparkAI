
import React, { useState, useCallback, useEffect } from 'react';
import { UploadIcon } from './Icons';

const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string; }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (!reader.result) {
        return reject(new Error("Could not read file."));
      }
      resolve({
        base64: (reader.result as string).split(',')[1],
        mimeType: file.type
      });
    }
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

interface ImagePromptProps {
  onImagesChange: (images: { base64: string; mimeType: string }[]) => void;
}

const ImagePrompt: React.FC<ImagePromptProps> = ({ onImagesChange }) => {
  const [uploaded, setUploaded] = useState<{ preview: string; base64: string; mimeType: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const totalImages = uploaded.length;
  const maxSelectionReached = totalImages >= 2;

  useEffect(() => {
    const allImages = uploaded.map(u => ({ base64: u.base64, mimeType: u.mimeType }));
    onImagesChange(allImages);
  }, [uploaded, onImagesChange]);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const availableSlots = 2 - totalImages;
    if (files.length > availableSlots) {
      setError(`You can only add ${availableSlots} more image(s). Please select fewer files.`);
      return;
    }
    
    setError(null);
    setIsConverting(true);
    
    try {
      const filePromises = Array.from(files).map(async file => {
        if (!file.type.startsWith('image/')) {
          throw new Error("Please upload only image files.");
        }
        const { base64, mimeType } = await fileToBase64(file);
        const preview = URL.createObjectURL(file);
        return { preview, base64, mimeType };
      });

      const newUploaded = await Promise.all(filePromises);
      setUploaded(prev => [...prev, ...newUploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while reading files.");
    } finally {
        setIsConverting(false);
    }
  }, [totalImages]);
  
  const removeUploadedImage = (indexToRemove: number) => {
    const imageToRemove = uploaded.find((_, index) => index === indexToRemove);
    if(imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
    }
    setUploaded(prev => prev.filter((_, i) => i !== indexToRemove));
  }
  
  const selectionCount = totalImages;

  return (
    <div className="text-left w-full animate-fade-in">
      <div className="mb-4">
        <div>
          <p className="text-gray-300">Upload 1-2 images.</p>
          <p className={`text-sm ${selectionCount < 1 || selectionCount > 2 ? 'text-yellow-400' : 'text-green-400'}`}>
              {selectionCount} / 2 selected
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center">
         <label htmlFor="file-upload" className={`w-full cursor-pointer flex flex-col items-center justify-center p-6 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg transition-colors
          ${!maxSelectionReached ? 'hover:bg-gray-700/50 hover:border-indigo-500' : 'opacity-50 cursor-not-allowed'}
         `}>
          <UploadIcon />
          <span className="mt-2 text-gray-300">
            {maxSelectionReached ? 'Maximum images selected' : 'Click to upload'}
          </span>
          <span className="text-xs text-gray-500">You can upload {2-totalImages} more image(s)</span>
        </label>
        <input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} disabled={maxSelectionReached || isConverting} />
      </div>

      {isConverting && (
          <div className="text-center py-4 text-sm text-indigo-300">Processing images...</div>
      )}
      {error && <p className="mt-2 text-sm text-red-400 text-center">{error}</p>}

      {(uploaded.length > 0) && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2 animate-slide-in-up">
          {uploaded.map((img, index) => (
            <div key={index} className="relative aspect-video">
              <img src={img.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-lg shadow-lg" />
              <button 
                onClick={() => removeUploadedImage(index)}
                className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs font-bold hover:bg-red-500 transition-colors"
                aria-label={`Remove image ${index+1}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImagePrompt;
