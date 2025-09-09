'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { startKakaoLogin } from '../../api/client';

const imgGroup = "/icons/picture-upload.svg";

interface CommentPostFormProps {
  onSubmit?: (comment: string) => void;
  onImageUpload?: (file: File) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

export default function CommentPostForm({ 
  onSubmit,
  onImageUpload,
  placeholder = '댓글을 입력하세요...',
  maxLength = 1000,
  disabled = false
}: CommentPostFormProps) {
  const { isAuthenticated } = useAuth();
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(false);
  const isComposingRef = useRef(false);
  
  // 고유한 컴포넌트 ID 생성 (완전한 분리를 위해)
  const componentId = useRef(`comment-form-${Date.now()}-${Math.random()}`).current;
  
  // 컴포넌트 타입을 명시적으로 구분
  const componentType = 'comment-form';
  
  // 디버깅을 위한 로그
  useEffect(() => {
  }, [componentId]);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 스크롤 복원 로직 제거로 인해 입력 내용 보존 로직도 불필요

  const handleSubmit = () => {
    if (comment.trim() && onSubmit) {
      onSubmit(comment); // 줄바꿈을 포함한 원본 텍스트 전송
      setComment(''); // 제출 후 입력창 초기화
    }
  };

  const handleTextareaClick = () => {
    if (!isAuthenticated) {
      const shouldLogin = confirm('로그인 후에 댓글을 남길 수 있습니다. 로그인하시겠습니까?');
      if (shouldLogin) {
        startKakaoLogin();
      }
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

  // 댓글 폼 전용 스타일 설정
  const containerWidth = 'w-[534px]';
  const inputAreaWidth = 'w-[534px]';
  const inputAreaHeight = 'h-[83px]';
  const footerSectionWidth = 'flex-1';
  const footerSectionHeight = 'h-[35px]';
  const buttonHeight = 'h-[35px]';

  return (
    <form className={`bg-white relative rounded-[8px] ${containerWidth}`} onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
      <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative size-full">
        {/* Input Area */}
        <div className={`${inputAreaHeight} shrink-0 ${inputAreaWidth} p-2.5`}>
          <textarea
            ref={textareaRef}
            id={componentId}
            name={`comment-form-${componentId}`}
            data-form-type={componentType}
            autoComplete="off"
            spellCheck="false"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onCompositionStart={() => {
              isComposingRef.current = true;
            }}
            onCompositionEnd={() => {
              isComposingRef.current = false;
            }}
            onClick={handleTextareaClick}
            placeholder={isAuthenticated ? placeholder : '로그인 후에 댓글을 남길 수 있습니다'}
            maxLength={maxLength}
            disabled={disabled}
            className={`w-full h-full px-1 resize-none border-none outline-none bg-transparent text-base font-normal font-['Pretendard'] leading-normal placeholder:text-[#c7c7cc] disabled:opacity-50 disabled:cursor-not-allowed ${!isAuthenticated ? 'cursor-pointer' : ''}`}
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
    </form>
  );
}