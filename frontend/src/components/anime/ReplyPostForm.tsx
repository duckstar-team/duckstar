'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { startKakaoLogin } from '../../api/client';
import { useImageUpload, UploadedImage } from '../../hooks/useImageUpload';
import ImageUploadPreview from '../common/ImageUploadPreview';

const imgGroup = "/icons/picture-upload.svg";

interface ReplyPostFormProps {
  onSubmit?: (comment: string, images?: File[]) => void;
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
  const { isAuthenticated } = useAuth();
  const [comment, setComment] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const commentRef = useRef('');
  const uploadedImagesRef = useRef<UploadedImage[]>([]);
  
  // 이미지 업로드 훅 사용
  const { uploadedImages, uploadImage, removeImage, formatFileSize, setUploadedImages, finishUpload, canUpload, startUpload } = useImageUpload();
  
  // 고유한 컴포넌트 ID 생성 (commentId와 listenerId 기반으로 안정적 생성)
  const componentId = useRef(`reply-form-${commentId || 'unknown'}-${listenerId || 'main'}`).current;
  
  // 전역 상태로 입력 내용 관리 (컴포넌트 리마운트에도 보존)
  const globalKey = `reply-form-${commentId || 'unknown'}-${listenerId || 'main'}`;
  
  // 컴포넌트 타입을 명시적으로 구분
  const componentType = 'reply-form';
  
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

  // 전역 상태로 입력 내용 관리 (컴포넌트 리마운트에도 보존)
  useEffect(() => {
    // 컴포넌트 마운트 시 저장된 내용 복원
    try {
      const savedComment = sessionStorage.getItem(globalKey);
      if (savedComment && savedComment.trim()) {
        setComment(savedComment);
      }
    } catch (error) {
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
    }
  }, [comment, globalKey]);

  // 컴포넌트 언마운트 시 저장된 내용 정리
  useEffect(() => {
    return () => {
      try {
        sessionStorage.removeItem(globalKey);
      } catch (error) {
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
  
  // ref 동기화
  useEffect(() => {
    commentRef.current = comment;
  }, [comment]);
  
  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  const handleSubmit = useCallback(() => {
    // 이미 제출 중이면 중복 호출 방지
    if (isSubmittingRef.current) {
      return;
    }
    
    const currentComment = commentRef.current;
    const currentImages = uploadedImagesRef.current;
    
    if ((currentComment.trim() || currentImages.length > 0) && onSubmit) {
      // 댓글당 이미지 1개 제한 체크
      if (currentImages.length > 1) {
        alert('댓글당 이미지는 1개까지만 업로드할 수 있습니다.');
        return;
      }
      
      // 이미지가 있는 경우 업로드 제한 체크
      if (currentImages.length > 0) {
        const uploadCheck = canUpload();
        if (!uploadCheck.canUpload) {
          alert(uploadCheck.message);
          return;
        }
      }
      
      // 제출 중 플래그 설정
      isSubmittingRef.current = true;
      
      const imageFiles = currentImages.map(img => img.file);
      const commentText = currentComment;
      
      // 이미지가 있는 경우 업로드 시작 처리
      if (currentImages.length > 0) {
        const uploadStart = startUpload();
        if (!uploadStart.canUpload) {
          alert(uploadStart.message);
          isSubmittingRef.current = false;
          return;
        }
      }
      
      // onSubmit 호출 (Promise 기반으로 완료 감지)
      Promise.resolve(onSubmit(commentText, imageFiles))
        .then(() => {
          // 성공 시 업로드 완료 처리
          finishUpload(true);
        })
        .catch(() => {
          // 실패 시 업로드 실패 처리
          finishUpload(false);
        })
        .finally(() => {
          // 상태 초기화 (텍스트와 이미지 모두)
          setComment('');
          setUploadedImages([]);
          
          // 제출 후 저장된 내용 삭제
          try {
            sessionStorage.removeItem(globalKey);
          } catch (error) {
          }
          
          // 제출 완료 후 플래그 리셋
          isSubmittingRef.current = false;
        });
    }
  }, [onSubmit, globalKey]);

  const handleImageUpload = () => {
    // 파일 입력 엘리먼트 생성
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true; // 여러 파일 선택 허용
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach(file => {
          uploadImage(file);
          // 기존 onImageUpload 콜백도 호출 (하위 호환성)
          if (onImageUpload) {
            onImageUpload(file);
          }
        });
      }
    };
    input.click();
  };

  const isSubmitDisabled = disabled || (!comment.trim() && uploadedImages.length === 0);

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
            onClick={() => {
              if (!isAuthenticated) {
                const shouldLogin = confirm('로그인 후에 답글을 남길 수 있습니다. 로그인하시겠습니까?');
                if (shouldLogin) {
                  startKakaoLogin();
                }
              }
            }}
            placeholder={isAuthenticated ? placeholder : '로그인 후에 답글을 남길 수 있습니다'}
            maxLength={maxLength}
            disabled={disabled}
            className="w-full h-full px-1 resize-none border-none outline-none bg-transparent text-base font-normal font-['Pretendard'] leading-normal placeholder:text-[#c7c7cc] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        
        {/* 이미지 미리보기 */}
        {uploadedImages.length > 0 && (
          <div className="w-full px-2.5 pb-2">
            <ImageUploadPreview 
              images={uploadedImages}
              onRemove={removeImage}
              formatFileSize={formatFileSize}
            />
          </div>
        )}
        
        {/* Action Bar */}
        <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
          {/* Section with upload button and character count */}
          <div className={`${footerSectionHeight} relative shrink-0 ${footerSectionWidth}`}>
            <div className={`box-border content-stretch flex justify-between ${footerSectionHeight} items-center overflow-clip px-3 relative w-full`}>
              {/* Upload Image Button */}
              <button
                type="button"
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
