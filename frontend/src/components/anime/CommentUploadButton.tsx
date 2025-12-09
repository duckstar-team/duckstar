'use client';

import React from 'react';

interface CommentUploadButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export default function CommentUploadButton({
  onClick,
  disabled = false,
}: CommentUploadButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="relative h-5 w-12 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div className="absolute top-[3px] left-0 size-4 overflow-hidden">
        <div className="absolute top-[15.43px] left-[15.44px] size-3.5 origin-top-left rotate-180 outline outline-offset-[-0.57px] outline-rose-800" />
        <div className="absolute top-[3.43px] left-[8.57px] size-1 outline outline-offset-[-0.57px] outline-rose-800" />
        <div className="absolute top-[8.57px] left-[0.57px] h-1.5 w-2.5 outline outline-offset-[-0.57px] outline-rose-800" />
        <div className="absolute top-[10.86px] left-[8.99px] h-[0.73px] w-1.5 outline outline-offset-[-0.57px] outline-rose-800" />
      </div>
      <div className="text-Grays-Gray absolute top-0 left-[23px] justify-start text-center text-base leading-snug font-normal">
        사
      </div>
    </button>
  );
}
