'use client';

import React from 'react';

interface CommentPostButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export default function CommentPostButton({ onClick, disabled = false }: CommentPostButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-20 h-9 px-8 py-2 bg-amber-200 border-l border-t border-gray5 inline-flex justify-center items-center gap-2.5 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="text-center justify-start text-white text-base font-semibold font-['Pretendard'] leading-snug">
        작성
      </div>
    </button>
  );
}
