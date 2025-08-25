'use client';

import { motion } from 'framer-motion';

export type VoteButtonVariant = 'next' | 'bonus' | 'submit';

interface VoteButtonProps {
  type: 'next' | 'bonus' | 'submit';
  onClick: () => void;
  disabled?: boolean;
}

export default function VoteButton({ type, onClick, disabled = false }: VoteButtonProps) {
  const baseClasses = "flex items-center justify-center pl-2.5 pr-3 h-10 rounded-lg font-['Pretendard',_sans-serif] font-bold text-base text-white transition-all duration-200 hover:brightness-110 w-fit";
  
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
        return 'NEXT';
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
      className={`${getButtonClasses()} ${disabled ? 'opacity-50 cursor-not-allowed hover:brightness-100' : 'cursor-pointer'}`}
    >
      {getButtonText()}
    </button>
  );
}
