import { useState, useCallback } from 'react';
import { useUploadLimits } from './useUploadLimits';

export interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
}

export function useImageUpload() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { canUpload, startUpload, finishUpload, uploadStats, limits } = useUploadLimits();

  const uploadImage = useCallback((file: File) => {

    // 파일 크기 제한 (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('파일 크기는 20MB를 초과할 수 없습니다.');
      return;
    }

    // 파일 타입 검증 (백엔드와 동일한 검증)
    const contentType = file.type;
    if (!contentType || !contentType.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 파일 확장자 검증
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase();
    const allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!ext || !allowedExt.includes(ext)) {
      alert('지원하지 않는 이미지 확장자입니다. (jpg, jpeg, png, gif, webp만 허용)');
      return;
    }

    // MIME 타입 검증
    const allowedMime = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMime.includes(contentType)) {
      alert('지원하지 않는 이미지 형식입니다.');
      return;
    }

    // 클라이언트 측에서도 ImageIO.read()와 유사한 검증 시도
    const img = new Image();
    img.onload = () => {
    };
    img.onerror = () => {
console.error('이미지 로드 실패 - 파일이 손상되었거나 유효하지 않은 이미지입니다.');
      alert('파일이 손상되었거나 유효하지 않은 이미지입니다. 다른 이미지를 시도해주세요.');
      return;
    };
    img.src = URL.createObjectURL(file);

    const id = Date.now().toString();
    const preview = URL.createObjectURL(file);
    
    const uploadedImage: UploadedImage = {
      id,
      file,
      preview,
      name: file.name,
      size: file.size
    };

    setUploadedImages(prev => [...prev, uploadedImage]);
  }, [uploadStats]);

  const removeImage = useCallback((id: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const clearAllImages = useCallback(() => {
    uploadedImages.forEach(img => {
      URL.revokeObjectURL(img.preview);
    });
    setUploadedImages([]);
  }, [uploadedImages]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return {
    uploadedImages,
    isUploading,
    uploadImage,
    removeImage,
    clearAllImages,
    formatFileSize,
    setUploadedImages,
    uploadStats,
    limits,
    finishUpload,
    canUpload,
    startUpload
  };
}
