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
  onRemoveFilter
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
      className="px-[7px] py-[2px] bg-rose-800 rounded-lg flex justify-center items-center gap-[7px] cursor-pointer hover:opacity-80 transition-opacity"
    >
      <div className="flex justify-center items-center">
        <div className="text-center flex items-center">
          <span className="text-white text-xs font-semibold font-['Pretendard']">{episodeNumber}화</span>
          <span className="text-white text-xs font-normal font-['Pretendard']"> / 방영주</span>
        </div>
      </div>
      <div className="size-2 relative overflow-hidden flex items-center justify-center">
        <img
          src="/icons/delete-filter.svg"
          alt="필터 제거"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );


  return (
    <div className="w-full max-w-[570px] pl-6 inline-flex flex-col justify-end items-start gap-3.5">
      {/* 필터가 없을 때는 기본 헤더만 표시 */}
      {variant === 'default' ? (
        <div className="w-full max-w-[570px] h-12 pr-6 pt-5 inline-flex justify-start items-end gap-3.5">
          <div className="size-7 relative overflow-hidden">
            <img
              src="/icons/comment-header-icon.svg"
              alt="댓글 아이콘"
              className="w-full h-full object-contain"
            />
          </div>
          <div className={`text-center justify-start text-black font-semibold font-['Pretendard'] leading-snug ${isVerySmallScreen ? 'text-lg' : 'text-xl'}`}>애니 댓글</div>
          <div className="text-center justify-start">
            <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug">총 </span>
            <span className="text-rose-800 text-base font-semibold font-['Pretendard'] leading-snug">{totalComments}</span>
            <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug"> 개</span>
          </div>
        </div>
      ) : (
        /* 필터가 있을 때 */
        <>
          {/* 첫 번째 줄: 헤더 + 초기화 버튼 */}
          <div className="self-stretch h-12 pr-6 pt-5 inline-flex justify-start items-end w-full">
            <div className="size-7 relative overflow-hidden">
              <img
                src="/icons/comment-header-icon.svg"
                alt="댓글 아이콘"
                className="w-full h-full object-contain"
              />
            </div>
            <div className={`text-center justify-start text-black font-semibold font-['Pretendard'] leading-snug ml-3.5 ${isVerySmallScreen ? 'text-lg' : 'text-xl'}`}>애니 댓글</div>
            <div className="text-center justify-start ml-3.5">
              <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug">총 </span>
              <span className="text-rose-800 text-base font-semibold font-['Pretendard'] leading-snug">{totalComments}</span>
              <span className="text-black text-base font-semibold font-['Pretendard'] leading-snug"> 개</span>
            </div>
            <button 
              onClick={onClearFilters}
              className="text-center justify-start text-base font-medium font-['Pretendard'] underline leading-snug hover:text-gray-600 transition-colors cursor-pointer ml-8"
              style={{ color: '#ADB5BD' }}
            >
              댓글 필터 초기화
            </button>
          </div>
          
          {/* 두 번째 줄: 가로 스크롤 필터 리스트 */}
          <div className="w-[532px] pl-5 overflow-x-auto">
            <div className="flex justify-start items-center gap-2 min-w-max">
              {activeFilters.map((episodeNumber) => (
                <FilterBadge key={episodeNumber} episodeNumber={episodeNumber} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
