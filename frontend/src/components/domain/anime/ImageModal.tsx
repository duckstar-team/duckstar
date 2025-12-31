'use client';

import { useEffect } from 'react';
import { useSidebarWidth } from '@/hooks/useSidebarWidth';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  title,
}: ImageModalProps) {
  const sidebarWidth = useSidebarWidth();

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // 스크롤은 막지 않고 모달만 최상위에 표시
    } else {
      document.removeEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 top-15 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* 모달 컨텐츠 - 사이드바를 제외한 중앙 영역에 위치 */}
      <div
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          marginLeft: sidebarWidth > 0 ? `${sidebarWidth}px` : 0,
          maxWidth: 'calc(100vw - 200px)',
        }}
      >
        {/* 이미지 */}
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[90vh] rounded-lg object-contain shadow-2xl"
          />

          {/* 이미지 제목 */}
          <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-gradient-to-t from-black/80 to-transparent p-4">
            <h3 className="text-lg font-medium text-white">{title}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
