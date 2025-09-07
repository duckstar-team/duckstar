'use client';

import React, { useState, useRef, useEffect } from 'react';

const imgGroup = "/icons/picture-upload.svg";

interface ReplyPostFormProps {
  onSubmit?: (comment: string) => void;
  onImageUpload?: (file: File) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  commentId?: number;
  listenerId?: number;
}

export default function ReplyPostForm({ 
  onSubmit,
  onImageUpload,
  placeholder = '답글을 입력하세요...',
  maxLength = 1000,
  disabled = false,
  commentId,
  listenerId
}: ReplyPostFormProps) {
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(false);
  
  // 고유한 컴포넌트 ID 생성 (commentId와 listenerId 기반으로 안정적 생성)
  const componentId = useRef(`reply-form-${commentId || 'unknown'}-${listenerId || 'main'}`).current;
  
  // 전역 상태로 입력 내용 관리 (컴포넌트 리마운트에도 보존)
  const globalKey = `reply-form-${commentId || 'unknown'}-${listenerId || 'main'}`;
  
  // 컴포넌트 타입을 명시적으로 구분
  const componentType = 'reply-form';
  
  // 디버깅을 위한 로그
  useEffect(() => {
    console.log(`ReplyPostForm mounted with ID: ${componentId}`);
    return () => {
      console.log(`ReplyPostForm unmounted with ID: ${componentId}`);
    };
  }, [componentId]);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // 전역 상태로 입력 내용 관리 (컴포넌트 리마운트에도 보존)
  useEffect(() => {
    // 컴포넌트 마운트 시 저장된 내용 복원
    try {
      const savedComment = sessionStorage.getItem(globalKey);
      if (savedComment && savedComment.trim()) {
        setComment(savedComment);
      }
    } catch (error) {
      console.warn('Failed to restore saved comment:', error);
    }
  }, [globalKey]);

  // 입력 내용 변경 시 실시간 저장
  useEffect(() => {
    try {
      if (comment.trim()) {
        sessionStorage.setItem(globalKey, comment);
      } else {
        sessionStorage.removeItem(globalKey);
      }
    } catch (error) {
      console.warn('Failed to save comment draft:', error);
    }
  }, [comment, globalKey]);

  // 컴포넌트 언마운트 시 저장된 내용 정리
  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(globalKey);
      } catch (error) {
        console.warn('Failed to cleanup comment draft:', error);
      }
    };
  }, [globalKey]);


  // 컴포넌트가 마운트될 때 포커스 설정
  useEffect(() => {
    if (textareaRef.current && isMountedRef.current) {
      setTimeout(() => {
        if (textareaRef.current && isMountedRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, []);

  const handleSubmit = () => {
    if (comment.trim() && onSubmit) {
      onSubmit(comment); // 줄바꿈을 포함한 원본 텍스트 전송
      setComment(''); // 제출 후 입력창 초기화
      // 제출 후 저장된 내용 삭제
      try {
        sessionStorage.removeItem(globalKey);
      } catch (error) {
        console.warn('Failed to remove saved comment after submit:', error);
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

  // 답글 폼 전용 스타일 설정 (기존 variant="forReply"와 동일)
  const containerWidth = 'w-[494px]';
  const inputAreaWidth = 'w-[494px]';
  const inputAreaHeight = 'h-[83px]';
  const footerSectionWidth = 'w-[414px]';
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
            name={`reply-form-${componentId}`}
            data-form-type={componentType}
            autoComplete="off"
            spellCheck="false"
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
    </form>
  );
}
