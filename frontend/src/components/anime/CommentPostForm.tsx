'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../AppContainer';
import { useImageUpload, UploadedImage } from '../../hooks/useImageUpload';
import ImageUploadPreview from '../common/ImageUploadPreview';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const imgGroup = '/icons/picture-upload.svg';

interface CommentPostFormProps {
  onSubmit?: (comment: string, images?: File[]) => Promise<void>;
  onImageUpload?: (file: File) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  initialValue?: string;
  submitLabel?: string;
  phase?: 'summary' | 'form';
  voteUpdatedAt?: string;
}

export default function CommentPostForm({
  onSubmit,
  onImageUpload,
  placeholder = '댓글을 입력하세요.',
  maxLength = 1000,
  disabled = false,
  initialValue = '',
  submitLabel,
  phase = 'form',
  voteUpdatedAt,
}: CommentPostFormProps) {
  const { user, isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();
  const [comment, setComment] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMountedRef = useRef(false);
  const isComposingRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const commentRef = useRef('');
  const uploadedImagesRef = useRef<UploadedImage[]>([]);

  // 이미지 업로드 훅 사용
  const {
    uploadedImages,
    uploadImage,
    removeImage,
    formatFileSize,
    setUploadedImages,
    finishUpload,
    canUpload,
    startUpload,
  } = useImageUpload();

  // 고유한 컴포넌트 ID 생성 (완전한 분리를 위해)
  const componentId = useRef(
    `comment-form-${Date.now()}-${Math.random()}`
  ).current;

  // 컴포넌트 타입을 명시적으로 구분
  const componentType = 'comment-form';

  // 디버깅을 위한 로그
  useEffect(() => {}, [componentId]);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ref 동기화
  useEffect(() => {
    commentRef.current = comment;
  }, [comment]);

  useEffect(() => {
    setComment(initialValue);
  }, [initialValue]);

  useEffect(() => {
    uploadedImagesRef.current = uploadedImages;
  }, [uploadedImages]);

  const handleSubmit = useCallback(() => {
    // 이미 제출 중이면 중복 호출 방지
    if (isSubmittingRef.current || isSubmitting) {
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
      setIsSubmitting(true);

      const imageFiles = currentImages.map((img) => img.file);
      const commentText = currentComment;

      // 이미지가 있는 경우 업로드 시작 처리
      if (currentImages.length > 0) {
        const uploadStart = startUpload();
        if (!uploadStart.canUpload) {
          alert(uploadStart.message);
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      // onSubmit 호출 (Promise 기반으로 완료 감지)
      Promise.resolve(onSubmit(commentText, imageFiles))
        .then(() => {
          // 성공 시에만 상태 초기화
          setComment('');
          setUploadedImages([]);
          finishUpload(true);
        })
        .catch((error) => {
          // 유효성 검사 실패인지 확인 (에러 메시지로 구분)
          const errorMessage = error?.message || '';
          const isValidationError =
            errorMessage.includes('로그인') ||
            errorMessage.includes('에피소드') ||
            errorMessage.includes('댓글 내용');

          if (isValidationError) {
            // 유효성 검사 실패: 상태 유지, 업로드 상태만 리셋
            finishUpload(false);
          } else {
            // 실제 API 실패: 상태 유지, 업로드 실패 처리
            finishUpload(false);
          }
        })
        .finally(() => {
          // 제출 완료 후 플래그 리셋
          isSubmittingRef.current = false;
          setIsSubmitting(false);
        });
    }
  }, [onSubmit, isSubmitting]); // onSubmit과 isSubmitting을 의존성으로 추가

  const handleTextareaClick = () => {
    if (!isAuthenticated) {
      openLoginModal();
    }
  };

  const handleImageUpload = () => {
    // 파일 입력 엘리먼트 생성
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true; // 여러 파일 선택 허용
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        Array.from(files).forEach((file) => {
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

  const isSubmitDisabled =
    disabled ||
    isSubmitting ||
    (!comment.trim() && uploadedImages.length === 0);

  // 댓글 폼 전용 스타일 설정
  const containerWidth = 'w-full max-w-[534px]';
  const inputAreaWidth = 'w-full max-w-[100%]';
  const inputAreaHeight = 'h-[83px]';
  const footerSectionWidth = 'flex-1';
  const footerSectionHeight = 'h-[35px]';
  const buttonHeight = 'h-[35px]';

  return (
    <form
      className={`relative rounded-[8px] bg-white ${containerWidth}`}
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <div className="relative flex size-full flex-col content-stretch items-center justify-center overflow-clip">
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
            placeholder={
              isAuthenticated
                ? placeholder
                : '로그인 후에 댓글을 남길 수 있습니다.'
            }
            maxLength={maxLength}
            disabled={disabled || phase === 'summary'}
            className="h-full w-full cursor-auto resize-none border-none bg-transparent px-1 text-base leading-normal font-normal text-black outline-none placeholder:text-[#c7c7cc] disabled:cursor-not-allowed disabled:opacity-50"
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
        <div className="relative flex w-full shrink-0 content-stretch items-center justify-between">
          {/* Section with upload button and character count */}
          <div
            className={`${footerSectionHeight} relative shrink-0 ${footerSectionWidth}`}
          >
            <div
              className={`box-border flex content-stretch justify-between ${footerSectionHeight} relative w-full items-center overflow-clip px-3`}
            >
              {phase ? (
                <div className="flex items-center gap-2">
                  {user && (
                    <>
                      <div className="flex-shrink-0 size-6">
                        <img
                          src={user?.profileImageUrl!}
                          alt="profile"
                          className="h-full w-full rounded-full object-contain"
                        />
                      </div>
                      <span className="text-sm font-bold text-[#8e8e93]">
                        {user?.nickname}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Upload Image Button */}
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={disabled}
                    className="flex h-[22px] cursor-pointer items-center gap-1 transition-opacity duration-200 hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="h-4 w-4 flex-shrink-0">
                      <img
                        alt=""
                        className="h-full w-full object-contain"
                        src={imgGroup}
                      />
                    </div>
                    <div className="font-['Pretendard'] text-[15px] leading-snug font-normal text-[#8e8e93]">
                      <p className="leading-[22px] whitespace-pre">사진</p>
                    </div>
                  </button>
                </>
              )}

              {/* Character Count */}
              <div className="text-right font-['Pretendard'] text-[15px] leading-snug font-normal text-[#8e8e93]">
                <p className="leading-[22px] whitespace-pre">
                  {phase === 'summary' && voteUpdatedAt
                    ? format(
                        new Date(voteUpdatedAt),
                        'yyyy.MM.dd (EEE) HH:mm',
                        { locale: ko }
                      )
                    : `(${comment.length}/${maxLength})`}
                </p>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 border-[1px_0px_0px] border-solid border-[#adb5bd]"
            />
          </div>

          {/* Post Button */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!isAuthenticated) {
                if (
                  confirm(
                    '댓글을 작성하려면 로그인이 필요합니다. 로그인하시겠습니까?'
                  )
                ) {
                  openLoginModal();
                  return;
                }
                return;
              } else {
                handleSubmit();
              }
            }}
            disabled={isSubmitDisabled || phase === 'summary'}
            className={`w-20 ${buttonHeight} flex cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-br-[10px] border-t border-l border-[#adb5bd] bg-amber-400 px-8 transition-colors duration-200 hover:bg-[#FED783] disabled:cursor-not-allowed! disabled:bg-[#FED783]`}
          >
            {isSubmitting ? (
              <>
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent text-white"></div>
                <span className="font-['Pretendard'] text-base leading-snug font-semibold whitespace-nowrap text-white">
                  작성 중...
                </span>
              </>
            ) : (
              <span className="font-['Pretendard'] text-base leading-snug font-semibold whitespace-nowrap text-white">
                {submitLabel ?? '작성'}
              </span>
            )}
          </button>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[8px] border border-solid border-[#adb5bd]"
      />
    </form>
  );
}
