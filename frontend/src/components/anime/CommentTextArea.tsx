'use client';

import React from 'react';

interface CommentTextAreaProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export default function CommentTextArea({ 
  value = '',
  onChange,
  placeholder = '댓글을 입력하세요...',
  maxLength = 1000,
  disabled = false
}: CommentTextAreaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="w-[534px] h-20 p-2.5">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className="w-full h-full resize-none border-none outline-none bg-transparent text-base font-normal font-['Pretendard'] leading-normal placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
