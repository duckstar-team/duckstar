'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export type VoteButtonVariant = 'next' | 'bonus' | 'submit';

interface VoteButtonProps {
  type: 'next' | 'bonus' | 'submit';
  onClick: () => void;
  disabled?: boolean;
  showError?: boolean;
}

export default function VoteButton({ type, onClick, disabled = false, showError = false }: VoteButtonProps) {
  const baseClasses = "flex items-center justify-center pl-2.5 pr-3 h-10 rounded-lg font-['Pretendard',_sans-serif] font-bold text-base text-white transition-all duration-200 hover:brightness-110";
  
  // NEXT 버튼의 경우 width 고정
  const getWidthClass = () => {
    if (type === 'next') {
      return 'w-[80px]'; // NEXT 버튼 고정 너비
    }
    return 'w-fit';
  };
  
  const getButtonClasses = () => {
    switch (type) {
      case 'next':
      case 'submit':
        return `${baseClasses} bg-gradient-to-r from-[#cb285e] to-[#9c1f49]`;
      case 'bonus':
        return `${baseClasses} bg-gradient-to-r from-[#ffb310] to-[#ce8e06]`;
      default:
        return baseClasses;
    }
  };

  const getButtonText = () => {
    switch (type) {
      case 'next':
        return showError ? null : 'NEXT';
      case 'bonus':
        return 'BONUS';
      case 'submit':
        return '제출하기';
      default:
        return '';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${getButtonClasses()} ${getWidthClass()} ${disabled ? 'opacity-50 hover:brightness-100' : 'cursor-pointer'}`}
    >
      <motion.span
        key={showError ? 'error' : 'normal'}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center"
      >
        {type === 'next' && showError ? (
          <Image
            src="/icons/button-block.svg"
            alt="Block Icon"
            width={20}
            height={20}
            className="w-5 h-5"
          />
        ) : (
          getButtonText()
        )}
      </motion.span>
    </button>
  );
}
