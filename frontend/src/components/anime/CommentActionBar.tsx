'use client';

import React from 'react';
import CommentBottomSection from './CommentBottomSection';
import CommentPostButton from './CommentPostButton';

interface CommentActionBarProps {
  characterCount?: number;
  maxCharacters?: number;
  onImageUpload?: () => void;
  onSubmit?: () => void;
  disabled?: boolean;
}

export default function CommentActionBar({ 
  characterCount = 0, 
  maxCharacters = 1000,
  onImageUpload,
  onSubmit,
  disabled = false
}: CommentActionBarProps) {
  return (
    <div className="size- inline-flex justify-start items-start">
      <div className="w-96 h-9 px-3 py-2 border-t border-gray5 flex justify-start items-center gap-80 overflow-hidden">
        <CommentBottomSection 
          characterCount={characterCount}
          maxCharacters={maxCharacters}
          onImageUpload={onImageUpload}
        />
      </div>
      <div className="w-20 h-9 px-8 py-2 bg-amber-200 border-l border-t border-gray5 flex justify-center items-center gap-2.5 overflow-hidden">
        <CommentPostButton 
          onClick={onSubmit}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
