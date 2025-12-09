'use client';

import React from 'react';

interface CommentPostButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export default function CommentPostButton({
  onClick,
  disabled = false,
}: CommentPostButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="border-gray5 inline-flex h-9 w-20 items-center justify-center gap-2.5 overflow-hidden border-t border-l bg-amber-200 px-8 py-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="justify-start text-center text-base leading-snug font-semibold text-white">
        작성
      </div>
    </button>
  );
}
