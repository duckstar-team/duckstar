'use client';

import React from 'react';

interface FilterBadgeProps {
  episodeNumber: number;
  onRemove: () => void;
  className?: string;
}

export default function FilterBadge({
  episodeNumber,
  onRemove,
  className = '',
}: FilterBadgeProps) {
  return (
    <div
      className={`flex items-center justify-center gap-[7px] rounded-[8.814px] bg-[#990033] px-[7.712px] py-[2.203px] ${className}`}
    >
      <div className="flex items-center justify-start gap-[5px] px-px py-0">
        <div className="text-[12px] leading-[0] whitespace-nowrap text-white not-italic">
          <p className="leading-[normal]">
            <span className="font-semibold">{episodeNumber}화</span>
            <span> / 방영주</span>
          </p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="relative h-[8.814px] w-[8.814px] shrink-0 overflow-hidden transition-opacity hover:opacity-70"
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
