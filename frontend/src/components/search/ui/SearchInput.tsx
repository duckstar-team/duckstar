'use client';

import { cn } from '@/lib/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  className?: string;
}

export default function SearchInput({ value, onChange, onSearch, placeholder = "검색어를 입력하세요", className }: SearchInputProps) {
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

  return (
    <div className={cn("bg-white relative rounded-[8px] size-full", className)}>
      <div className="box-border content-stretch flex items-center justify-start overflow-clip pl-[25px] pr-px py-[13px] relative size-full">
        {/* 돋보기 아이콘 버튼 */}
        <button 
          onClick={handleSearchClick}
          className="bg-[#fff8e9] box-border content-stretch flex items-center justify-center p-px relative rounded-[8px] shrink-0 size-9 cursor-pointer hover:bg-[#fff0d0] transition-colors"
        >
          <div aria-hidden="true" className="absolute border border-[#ffb310] border-solid inset-0 pointer-events-none rounded-[8px]" />
          <div className="relative shrink-0 size-[17.59px]">
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
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 ml-8 bg-transparent border-none outline-none text-gray-900 placeholder-[#9ca3af] text-base font-['Pretendard'] font-normal"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      
      {/* 테두리 */}
      <div aria-hidden="true" className="absolute border border-[#dadce0] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}
