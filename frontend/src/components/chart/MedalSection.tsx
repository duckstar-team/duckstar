'use client';

import MedalGrid from './MedalGrid';

interface MedalData {
  id: string;
  type: "Gold" | "Silver" | "Bronze" | "None";
  title?: string;
  image?: string;
  rank?: number;
  year?: number;
  quarter?: number;
  week?: number;
}

interface MedalSectionProps {
  medals: MedalData[];
  isExpanded?: boolean;
  className?: string;
  hideMedalsOnMobile?: boolean;
  isMobileVersion?: boolean;
}

export default function MedalSection({
  medals,
  isExpanded = false,
  className = "",
  hideMedalsOnMobile = false,
  isMobileVersion = false
}: MedalSectionProps) {
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      {/* 메달 그리드 - 768px 미만에서 숨김 */}
      <div className={`${hideMedalsOnMobile ? 'hidden md:block' : 'block'}`}>
        <MedalGrid 
          medals={medals} 
          hideSeparators={isMobileVersion}
        />
      </div>
      
      {/* 세퍼레이터 - 메달이 숨겨진 모바일에서도 표시 (모바일 버전에서는 숨김) */}
      <div className={`w-0 h-[52px] border-l border-gray-300 ${hideMedalsOnMobile && !isMobileVersion ? 'block md:hidden' : 'hidden'}`}></div>
      
      {/* 드롭다운 버튼 - 항상 표시 (모바일 버전에서는 숨김) */}
      {!isMobileVersion && (
        <div className="w-12 h-52 inline-flex flex-col justify-center items-center gap-2.5">
        <svg 
          className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : 'rotate-0'
          }`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        </div>
      )}
    </div>
  );
}
