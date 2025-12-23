'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';

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
      className="fixed z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      style={{
        // 헤더 60px 아래부터 시작
        top: '60px',
        left: '0',
        right: '0',
        bottom: '0',
      }}
    >
      {/* 모달 컨텐츠 - 사이드바를 제외한 중앙 영역에 위치 */}
      <div
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        style={{
          // 사이드바를 제외한 중앙 영역에 위치하도록 오른쪽으로 이동
          marginLeft: '200px', // 사이드바 너비만큼 오른쪽으로 이동
          maxWidth: 'calc(100vw - 200px)', // 양쪽 여백 고려
          maxHeight: '90vh',
        }}
      >
        {/* 이미지 */}
        <div className="relative">
          <img
            src={imageUrl}
            alt={title}
            className="rounded-lg object-contain shadow-2xl"
            style={{
              maxWidth: 'calc(100vw - 200px)', // 사이드바를 제외한 영역 크기
              maxHeight: '90vh',
            }}
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
