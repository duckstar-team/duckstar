'use client';

import React, { useState, useEffect } from 'react';

interface CommentHeaderProps {
  totalComments?: number;
  variant?: 'default' | 'withFilters';
  activeFilters?: number[];
  onClearFilters?: () => void;
  onRemoveFilter?: (episodeNumber: number) => void;
}

export default function CommentHeader({
  totalComments = 8,
  variant = 'default',
  activeFilters = [],
  onClearFilters,
  onRemoveFilter,
}: CommentHeaderProps) {
  // 화면 크기 감지 (425px 미만에서 텍스트 크기 조정)
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsVerySmallScreen(window.innerWidth < 425);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  // 필터 배지 컴포넌트
  const FilterBadge = ({ episodeNumber }: { episodeNumber: number }) => (
    <div
      onClick={() => onRemoveFilter?.(episodeNumber)}
      className="flex cursor-pointer items-center justify-center gap-[7px] rounded-lg bg-rose-800 px-[7px] py-[2px] transition-opacity hover:opacity-80"
    >
      <div className="flex items-center justify-center">
        <div className="flex items-center text-center">
          <span className="text-xs font-semibold text-white">
            {episodeNumber}화
          </span>
          <span className="text-xs font-normal text-white"> / 방영주</span>
        </div>
      </div>
      <div className="relative flex size-2 items-center justify-center overflow-hidden">
        <img
          src="/icons/delete-filter.svg"
          alt="필터 제거"
          className="h-full w-full object-contain"
        />
      </div>
    </div>
  );

  return (
    <div className="inline-flex w-full max-w-[570px] flex-col items-start justify-end gap-3.5 pl-6">
      {/* 필터가 없을 때는 기본 헤더만 표시 */}
      {variant === 'default' ? (
        <div className="inline-flex h-12 w-full max-w-[570px] items-end justify-start gap-3.5 pt-5 pr-6">
          <div className="relative size-7 overflow-hidden">
            <img
              src="/icons/comment-header-icon.svg"
              alt="댓글 아이콘"
              className="h-full w-full object-contain"
            />
          </div>
          <div
            className={`justify-start text-center leading-snug font-semibold text-black ${isVerySmallScreen ? 'text-lg' : 'text-xl'}`}
          >
            애니 댓글
          </div>
          <div className="justify-start text-center">
            <span className="text-base leading-snug font-semibold text-black">
              총{' '}
            </span>
            <span className="text-base leading-snug font-semibold text-rose-800">
              {totalComments}
            </span>
            <span className="text-base leading-snug font-semibold text-black">
              {' '}
              개
            </span>
          </div>
        </div>
      ) : (
        /* 필터가 있을 때 */
        <>
          {/* 첫 번째 줄: 헤더 + 초기화 버튼 */}
          <div className="inline-flex h-12 w-full items-end justify-start self-stretch pt-5 pr-6">
            <div className="relative size-7 overflow-hidden">
              <img
                src="/icons/comment-header-icon.svg"
                alt="댓글 아이콘"
                className="h-full w-full object-contain"
              />
            </div>
            <div
              className={`ml-3.5 justify-start text-center leading-snug font-semibold text-black ${isVerySmallScreen ? 'text-lg' : 'text-xl'}`}
            >
              애니 댓글
            </div>
            <div className="ml-3.5 justify-start text-center">
              <span className="text-base leading-snug font-semibold text-black">
                총{' '}
              </span>
              <span className="text-base leading-snug font-semibold text-rose-800">
                {totalComments}
              </span>
              <span className="text-base leading-snug font-semibold text-black">
                {' '}
                개
              </span>
            </div>
            <button
              onClick={onClearFilters}
              className="ml-8 cursor-pointer justify-start text-center text-base leading-snug font-medium underline transition-colors hover:text-gray-600"
              style={{ color: '#ADB5BD' }}
            >
              댓글 필터 초기화
            </button>
          </div>

          {/* 두 번째 줄: 가로 스크롤 필터 리스트 */}
          <div className="w-[532px] overflow-x-auto pl-5">
            <div className="flex min-w-max items-center justify-start gap-2">
              {activeFilters.map((episodeNumber) => (
                <FilterBadge
                  key={episodeNumber}
                  episodeNumber={episodeNumber}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
