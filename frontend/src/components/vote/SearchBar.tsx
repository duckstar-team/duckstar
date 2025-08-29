'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchBar = ({ 
  value, 
  onChange, 
  placeholder = "애니메이션 제목을 입력하세요" 
}: SearchBarProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      const newPlaceholder = mobile ? "제목 검색" : "애니메이션 제목을 입력하세요";
      
      setIsMobile(mobile);
      setCurrentPlaceholder(newPlaceholder);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return (
    <div className="flex items-center gap-[16px] flex-1">
      {/* Search Icon */}
      <div className="w-[20px] h-[20px] flex-shrink-0">
        <Image
          src="/icons/voteSection-search.svg"
          alt="Search Icon"
          width={20}
          height={20}
          className="w-full h-full"
        />
      </div>
      
      {/* Search Input */}
      <div className="flex-1 max-w-[380px]">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={isClient ? currentPlaceholder : "DESKTOP SEARCH"}
            className="w-full h-[40px] px-[16px] py-[8px] bg-white border-b-2 border-[#990033] outline-none text-[14px] placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar; 