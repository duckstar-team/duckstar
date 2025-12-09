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
  onImageUpload,
}: CommentBottomSectionProps) {
  return (
    <div className="border-gray5 inline-flex h-9 w-96 items-center justify-start gap-80 overflow-hidden border-t px-3 py-2">
      <CommentUploadButton onClick={onImageUpload} />
      <div className="text-Grays-Gray justify-start text-center text-base leading-snug font-normal">
        ({characterCount}/{maxCharacters})
      </div>
    </div>
  );
}
