'use client';

import React, { useState } from 'react';

const imgGroup = "/icons/picture-upload.svg";

interface CommentPostFormProps {
  onSubmit?: (comment: string) => void;
  onImageUpload?: (file: File) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  variant?: 'forComment' | 'forReply';
}

export default function CommentPostForm({ 
  onSubmit,
  onImageUpload,
  placeholder = '댓글을 입력하세요...',
  maxLength = 1000,
  disabled = false,
  variant = 'forComment'
}: CommentPostFormProps) {
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (comment.trim() && onSubmit) {
      onSubmit(comment.trim());
      setComment(''); // 제출 후 입력창 초기화
    }
  };

  const handleImageUpload = () => {
    if (onImageUpload) {
      // 파일 입력 엘리먼트 생성
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && onImageUpload) {
          onImageUpload(file);
        }
      };
      input.click();
    }
  };

  const isSubmitDisabled = disabled || !comment.trim();

  // variant에 따른 스타일 설정
  console.log('CommentPostForm variant:', variant); // 디버깅용
  const containerWidth = variant === 'forReply' ? 'w-[494px]' : 'w-[534px]';
  const inputAreaWidth = variant === 'forReply' ? 'w-[494px]' : 'w-[534px]';
  const inputAreaHeight = 'h-[83px]';
  const footerSectionWidth = variant === 'forReply' ? 'w-[414px]' : 'flex-1';
  const footerSectionHeight = 'h-[35px]';
  const buttonHeight = 'h-[35px]';

  return (
    <div className={`bg-white relative rounded-[8px] ${containerWidth}`}>
      <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative size-full">
        {/* Input Area */}
        <div className={`${inputAreaHeight} shrink-0 ${inputAreaWidth} p-2.5`}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            className="w-full h-full px-1 resize-none border-none outline-none bg-transparent text-base font-normal font-['Pretendard'] leading-normal placeholder:text-[#c7c7cc] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        {/* Action Bar */}
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          {/* Section with upload button and character count */}
          <div className={`${footerSectionHeight} relative shrink-0 ${footerSectionWidth}`}>
            <div className={`box-border content-stretch flex justify-between ${footerSectionHeight} items-center overflow-clip px-3 relative w-full`}>
              {/* Upload Image Button */}
              <button
                onClick={handleImageUpload}
                disabled={disabled}
                className="h-[22px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:opacity-70 transition-opacity duration-200 flex items-center gap-1"
              >
                <div className="w-4 h-4 flex-shrink-0">
                  <img alt="" className="w-full h-full object-contain" src={imgGroup} />
                </div>
                <div className="text-[#8e8e93] text-[15px] font-normal font-['Pretendard'] leading-snug">
                  <p className="leading-[22px] whitespace-pre">사진</p>
                </div>
              </button>
              
              {/* Character Count */}
              <div className="text-[#8e8e93] text-[15px] font-normal font-['Pretendard'] leading-snug text-right">
                <p className="leading-[22px] whitespace-pre">({comment.length}/{maxLength})</p>
              </div>
            </div>
            <div aria-hidden="true" className="absolute border-[#adb5bd] border-[1px_0px_0px] border-solid inset-0 pointer-events-none" />
          </div>
          
          {/* Post Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`w-20 ${buttonHeight} px-8 bg-[#FED783]/70 border-l border-t border-[#adb5bd] flex justify-center items-center gap-2.5 overflow-hidden rounded-br-[10px] cursor-pointer hover:bg-[#FED783] transition-colors duration-200`}
          >
            <span className="text-white text-base font-semibold font-['Pretendard'] leading-snug whitespace-nowrap">작성</span>
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-[#adb5bd] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}