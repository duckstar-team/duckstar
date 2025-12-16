import React from 'react';
import { X } from 'lucide-react';
import { UploadedImage } from '../../hooks/useImageUpload';

interface ImageUploadPreviewProps {
  images: UploadedImage[];
  onRemove: (id: string) => void;
  formatFileSize: (bytes: number) => string;
}

export default function ImageUploadPreview({
  images,
  onRemove,
  formatFileSize,
}: ImageUploadPreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {images.map((image) => (
        <div key={image.id} className="group relative">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <img
              src={image.preview}
              alt={image.name}
              className="h-full w-full object-cover"
            />
            <button
              onClick={() => onRemove(image.id)}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="bg-opacity-50 absolute right-0 bottom-0 left-0 rounded-b-lg bg-black p-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="truncate">{image.name}</div>
            <div className="text-xs opacity-75">
              {formatFileSize(image.size)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
