'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export type VoteButtonVariant = 'next' | 'bonus' | 'submit';

interface VoteButtonProps {
  type: VoteButtonVariant;
  onClick: () => void;
  disabled?: boolean;
  showError?: boolean;
}

const BUTTON_CONFIG = {
  next: {
    width: 'w-fit',
    gradient: 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49]',
    text: 'NEXT',
  },
  bonus: {
    width: 'w-fit',
    gradient: 'bg-gradient-to-r from-[#ffb310] to-[#ce8e06]',
    text: 'BONUS',
  },
  submit: {
    width: 'w-fit',
    gradient: 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49]',
    text: '제출하기',
  },
} as const;

export default function VoteButton({ 
  type, 
  onClick, 
  disabled = false, 
  showError = false 
}: VoteButtonProps) {
  const config = BUTTON_CONFIG[type];
  const baseClasses = "flex items-center justify-center pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 h-8 sm:h-10 rounded-lg font-['Pretendard',_sans-serif] font-bold text-sm sm:text-base text-white transition-all duration-200 hover:brightness-110 text-center";
  
  const buttonClasses = `${baseClasses} ${config.gradient} ${config.width}`;
  const disabledClasses = disabled ? 'opacity-50 hover:brightness-100' : 'cursor-pointer';
  
  const getButtonContent = () => {
    if (type === 'next' && showError) {
      return (
        <Image
          src="/icons/button-block.svg"
          alt="Block Icon"
          width={20}
          height={20}
          className="w-4 h-4 sm:w-5 sm:h-5"
        />
      );
    }
    return config.text;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${buttonClasses} ${disabledClasses}`}
    >
      <motion.span
        key={showError ? 'error' : 'normal'}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-center w-full text-center"
      >
        {getButtonContent()}
      </motion.span>
    </button>
  );
}
