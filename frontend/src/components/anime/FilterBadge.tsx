'use client';

import React from 'react';

interface FilterBadgeProps {
  episodeNumber: number;
  onRemove: () => void;
  className?: string;
}

export default function FilterBadge({ episodeNumber, onRemove, className = '' }: FilterBadgeProps) {
  return (
    <div className={`bg-[#990033] flex gap-[7px] items-center justify-center px-[7.712px] py-[2.203px] rounded-[8.814px] ${className}`}>
      <div className="flex gap-[5px] items-center justify-start px-px py-0">
        <div className="font-['Pretendard'] leading-[0] not-italic text-[12px] text-white whitespace-nowrap">
          <p className="leading-[normal]">
            <span className="font-semibold">{episodeNumber}화</span>
            <span> / 방영주</span>
          </p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="overflow-hidden relative shrink-0 w-[8.814px] h-[8.814px] hover:opacity-70 transition-opacity"
        aria-label="필터 제거"
      >
        <div className="absolute inset-[3.58%]">
          <div className="absolute inset-[-6.73%]">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 8 8"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 2L2 6M2 2L6 6"
                stroke="white"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </button>
    </div>
  );
}
