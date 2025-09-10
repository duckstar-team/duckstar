'use client';

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
  formatFileSize 
}: ImageUploadPreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {images.map((image) => (
        <div key={image.id} className="relative group">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
            <img
              src={image.preview}
              alt={image.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => onRemove(image.id)}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="truncate">{image.name}</div>
            <div className="text-xs opacity-75">{formatFileSize(image.size)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
