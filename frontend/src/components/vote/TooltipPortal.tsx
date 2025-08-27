'use client';

import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface TooltipPortalProps {
  type: 'bonus' | 'max-votes';
  position: { x: number; y: number };
  onHide?: () => void;
  show: boolean;
}

export default function TooltipPortal({ 
  type, 
  position, 
  onHide, 
  show 
}: TooltipPortalProps) {
  if (typeof window === 'undefined' || !show || position.x <= 0) {
    return null;
  }

  const tooltipContent = {
    'bonus': {
      image: "/icons/textBalloon-long.svg",
      text: "보너스 표는 2개가 모여야 일반 표 1개와 같습니다.",
      showHideButton: true
    },
    'max-votes': {
      image: "/icons/textBalloon.svg",
      text: "더 투표하고 싶으신가요?",
      showHideButton: false
    }
  };

  const content = tooltipContent[type];

  return createPortal(
    <div 
      className="fixed pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 55}px`,
        transform: 'translateX(-50%)',
        zIndex: 999999 // 헤더(z-50)보다 훨씬 높은 z-index
      }}
    >
      <div className="relative w-max pointer-events-auto">
        <img
          src={type === 'bonus' ? "/icons/textBalloon.svg" : "/icons/textBalloon.svg"}
          alt="Text Balloon"
          height={55}
          width={type === 'bonus' ? 'auto' : 140}
          className="md:hidden"
          style={{
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))'
          }}
        />
        <img
          src={content.image}
          alt="Text Balloon"
          height={55}
          className="w-auto h-auto hidden md:block"
          style={{
            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))'
          }}
        />
        
        {/* Text overlay */}
        <div className="absolute inset-0 flex items-center justify-center px-4 py-1 -translate-y-1 md:px-6 md:py-2">
          <div className="flex flex-col font-['Pretendard',_sans-serif] font-normal justify-center text-[#000000] text-sm md:text-base">
            <p className="leading-[18px] md:leading-[22px] whitespace-pre">
              {type === 'bonus' ? (
                <>
                  <span className="block md:hidden">보너스 표는 2개가 모여야</span>
                  <span className="block md:hidden"> 일반 표 1개와 같습니다.</span>
                  <span className="hidden md:inline">보너스 표는 2개가 모여야 일반 표 1개와 같습니다.</span>
                </>
              ) : (
                <>
                  <span className="block md:hidden">더 투표할까요?</span>
                  <span className="hidden md:inline">더 투표하고 싶으신가요?</span>
                </>
              )}
            </p>
          </div>
        </div>
        
        {/* Hide notification button */}
        {content.showHideButton && onHide && (
          <div className="absolute top-1 right-1">
            <motion.button
              className="w-4 h-4 flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onHide}
            >
              <Image
                src="/icons/voteSection-notify-hide.svg"
                alt="Hide Notification"
                width={16}
                height={16}
                className="w-full h-full"
              />
            </motion.button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

