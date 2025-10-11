'use client';

import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({ value, onChange, onSearch, placeholder = "검색어를 입력하세요", className }: SearchInputProps) {
  const [truncatedPlaceholder, setTruncatedPlaceholder] = useState(placeholder);
  const inputRef = useRef<HTMLInputElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  const handleSearchClick = () => {
    if (onSearch) {
      onSearch();
    }
  };

  // placeholder 텍스트 길이 측정 및 잘라내기
  useEffect(() => {
    if (!placeholder || !inputRef.current || !measureRef.current) return;

    const input = inputRef.current;
    const measure = measureRef.current;
    
    // 입력 필드의 실제 너비 계산 (패딩, 마진 제외)
    const inputRect = input.getBoundingClientRect();
    // 반응형 패딩에 맞게 계산 (pl-3 sm:pl-4 md:pl-[25px] + pr-px)
    const leftPadding = window.innerWidth >= 768 ? 25 : window.innerWidth >= 640 ? 16 : 12;
    const inputWidth = inputRect.width - leftPadding - 1; // 좌우 패딩 제외
    
    // 측정용 span에 동일한 스타일 적용
    measure.style.fontSize = window.getComputedStyle(input).fontSize;
    measure.style.fontFamily = window.getComputedStyle(input).fontFamily;
    measure.style.fontWeight = window.getComputedStyle(input).fontWeight;
    measure.style.letterSpacing = window.getComputedStyle(input).letterSpacing;
    
    // 텍스트가 입력 필드 너비를 넘는지 확인
    measure.textContent = placeholder;
    const textWidth = measure.getBoundingClientRect().width;
    
    if (textWidth > inputWidth) {
      // 텍스트가 너무 길면 잘라내기
      let truncated = placeholder;
      while (measure.textContent && measure.getBoundingClientRect().width > inputWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
        measure.textContent = truncated + '...';
      }
      setTruncatedPlaceholder(truncated + '...');
    } else {
      setTruncatedPlaceholder(placeholder);
    }
  }, [placeholder]);

  return (
    <div className={cn("bg-white relative rounded-[8px] size-full", className)}>
      <div className="box-border content-stretch flex items-center justify-start overflow-clip pl-3 sm:pl-4 md:pl-[25px] pr-px py-[13px] relative size-full">
        {/* 돋보기 아이콘 버튼 */}
        <button 
          onClick={handleSearchClick}
          className="bg-[#fff8e9] box-border content-stretch flex items-center justify-center p-px relative rounded-[8px] shrink-0 w-7 h-7 sm:w-8 sm:h-8 md:size-9 cursor-pointer hover:bg-[#fff0d0] transition-colors"
        >
          <div aria-hidden="true" className="absolute border border-[#ffb310] border-solid inset-0 pointer-events-none rounded-[8px]" />
          <div className="relative shrink-0 w-4 h-4 sm:w-[15px] sm:h-[15px] md:size-[17.59px]">
            {/* 돋보기 아이콘 SVG */}
            <img 
              src="/icons/searchSection-search-icon.svg" 
              alt="Search" 
              className="w-full h-full"
            />
          </div>
        </button>
        
        {/* 검색 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={truncatedPlaceholder}
          className="flex-1 ml-2 sm:ml-4 md:ml-8 bg-transparent border-none outline-none text-gray-900 placeholder-[#9ca3af] text-sm sm:text-base font-['Pretendard'] font-normal"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      
      {/* 테두리 */}
      <div aria-hidden="true" className="absolute border border-[#dadce0] border-solid inset-0 pointer-events-none rounded-[8px]" />
      
      {/* 텍스트 길이 측정용 숨겨진 span */}
      <span
        ref={measureRef}
        className="absolute -top-[9999px] left-0 opacity-0 pointer-events-none whitespace-nowrap"
        aria-hidden="true"
      />
    </div>
  );
}