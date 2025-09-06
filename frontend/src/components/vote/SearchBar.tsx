'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

// Types
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface PlaceholderConfig {
  mobile: string;
  desktop: string;
}

// Constants
const PLACEHOLDER_CONFIG: PlaceholderConfig = {
  mobile: "애니 검색 (원피스, ㅇㅍㅅ, ...)",
  desktop: "애니메이션 검색 (원피스, ㅇㅍㅅ, ...)"
} as const;

const MOBILE_BREAKPOINT = 768;

const STYLES = {
  container: "flex items-center gap-4 flex-1",
  iconContainer: "w-5 h-5 flex-shrink-0",
  inputContainer: "flex-1 max-w-[380px] min-w-[60px]",
  inputWrapper: "relative",
  input: "w-full h-10 py-2 bg-white border-b-2 border-[#990033] outline-none text-sm placeholder-gray-400",
} as const;

// 340px 이하에서 SearchBar width를 작게 조정하는 함수
const getInputContainerStyle = (isMobile: boolean, screenWidth: number) => {
  if (isMobile && screenWidth <= 340) {
    return "flex-1 max-w-[120px] min-w-[40px]";
  } else if (isMobile) {
    return "flex-1 max-w-[280px] min-w-[120px]";
  }
  return STYLES.inputContainer;
};

// Utility functions
const getPlaceholder = (isMobile: boolean): string => {
  return isMobile ? PLACEHOLDER_CONFIG.mobile : PLACEHOLDER_CONFIG.desktop;
};

const getInputPadding = (isMobile: boolean) => {
  return {
    paddingLeft: isMobile ? '4px' : '16px',
    paddingRight: isMobile ? '4px' : '16px'
  };
};

// Custom hook
const useResponsivePlaceholder = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [screenWidth, setScreenWidth] = useState(0);
  
  useEffect(() => {
    setIsClient(true);
    
    const checkResponsive = () => {
      const width = window.innerWidth;
      const mobile = width < MOBILE_BREAKPOINT;
      const newPlaceholder = getPlaceholder(mobile);
      
      setIsMobile(mobile);
      setCurrentPlaceholder(newPlaceholder);
      setScreenWidth(width);
    };
    
    checkResponsive();
    window.addEventListener('resize', checkResponsive);
    
    return () => window.removeEventListener('resize', checkResponsive);
  }, []);
  
  return { isMobile, currentPlaceholder, isClient, screenWidth };
};

// Components
const SearchIcon = () => (
  <div className={STYLES.iconContainer}>
    <Image
      src="/icons/voteSection-search.svg"
      alt="Search Icon"
      width={20}
      height={20}
      className="w-full h-full"
    />
  </div>
);

const SearchInput = ({ 
  value, 
  onChange, 
  isMobile, 
  currentPlaceholder, 
  isClient,
  screenWidth
}: {
  value: string;
  onChange: (value: string) => void;
  isMobile: boolean;
  currentPlaceholder: string;
  isClient: boolean;
  screenWidth: number;
}) => (
  <div className={getInputContainerStyle(isMobile, screenWidth)}>
    <div className={STYLES.inputWrapper}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isClient ? currentPlaceholder : "DESKTOP SEARCH"}
        className={STYLES.input}
        style={getInputPadding(isMobile)}
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  </div>
);

// Main component
export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "애니메이션 제목을 입력하세요" 
}: SearchBarProps) {
  const { isMobile, currentPlaceholder, isClient, screenWidth } = useResponsivePlaceholder();
  
  return (
    <div className={STYLES.container}>
      <SearchIcon />
      <SearchInput
        value={value}
        onChange={onChange}
        isMobile={isMobile}
        currentPlaceholder={currentPlaceholder}
        isClient={isClient}
        screenWidth={screenWidth}
      />
    </div>
  );
} 