'use client';

import React from 'react';

interface CommentUploadButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export default function CommentUploadButton({ onClick, disabled = false }: CommentUploadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-12 h-5 relative disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="size-4 left-0 top-[3px] absolute overflow-hidden">
        <div className="size-3.5 left-[15.44px] top-[15.43px] absolute origin-top-left rotate-180 outline outline-1 outline-offset-[-0.57px] outline-rose-800" />
        <div className="size-1 left-[8.57px] top-[3.43px] absolute outline outline-1 outline-offset-[-0.57px] outline-rose-800" />
        <div className="w-2.5 h-1.5 left-[0.57px] top-[8.57px] absolute outline outline-1 outline-offset-[-0.57px] outline-rose-800" />
        <div className="w-1.5 h-[0.73px] left-[8.99px] top-[10.86px] absolute outline outline-1 outline-offset-[-0.57px] outline-rose-800" />
      </div>
      <div className="left-[23px] top-0 absolute text-center justify-start text-Grays-Gray text-base font-normal font-['Pretendard'] leading-snug">
        사
      </div>
    </button>
  );
}
