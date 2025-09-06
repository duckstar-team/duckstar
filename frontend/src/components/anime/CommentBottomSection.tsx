'use client';

import React from 'react';
import CommentUploadButton from './CommentUploadButton';

interface CommentBottomSectionProps {
  characterCount?: number;
  maxCharacters?: number;
  onImageUpload?: () => void;
}

export default function CommentBottomSection({ 
  characterCount = 0, 
  maxCharacters = 1000,
  onImageUpload 
}: CommentBottomSectionProps) {
  return (
    <div className="w-96 h-9 px-3 py-2 border-t border-gray5 inline-flex justify-start items-center gap-80 overflow-hidden">
      <CommentUploadButton onClick={onImageUpload} />
      <div className="text-center justify-start text-Grays-Gray text-base font-normal font-['Pretendard'] leading-snug">
        ({characterCount}/{maxCharacters})
      </div>
    </div>
  );
}
