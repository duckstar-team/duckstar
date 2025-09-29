'use client';

import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

// Types
interface TooltipPortalProps {
  type: 'bonus' | 'max-votes';
  position: { x: number; y: number };
  onHide?: () => void;
  show: boolean;
}

interface TooltipConfig {
  image: string;
  text: string;
  showHideButton: boolean;
  mobileWidth: number;
  desktopWidth: string;
}

interface PositionStyle {
  top: number;
  transform: string;
  zIndex: number;
}

// Constants
const TOOLTIP_CONFIG: Record<'bonus' | 'max-votes', TooltipConfig> = {
  'bonus': {
    image: "/icons/textBalloon-long.svg",
    text: "보너스 표는 2개가 모여야 일반 표 1개와 같습니다.",
    showHideButton: true,
    mobileWidth: 155,
    desktopWidth: 'auto',
  },
  'max-votes': {
    image: "/icons/textBalloon.svg",
    text: "더 투표하고 싶으신가요?",
    showHideButton: false,
    mobileWidth: 90,
    desktopWidth: 'auto',
  },
} as const;

const STYLES = {
  tooltip: {
    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.15))',
  },
  position: {
    top: -26,
    transform: 'translateX(-50%)',
    zIndex: 999999,
  },
  desktopBonusPosition: {
    top: -75,
    transform: 'translateX(-50%)',
    zIndex: 999999,
  },
  desktopMaxVotesPosition: {
    top: -75,
    transform: 'translateX(-50%)',
    zIndex: 999999,
  },
} as const;

const MOBILE_BREAKPOINT = 768;

// Utility functions
const getDesktopPosition = (type: 'bonus' | 'max-votes'): PositionStyle => {
  if (typeof window === 'undefined' || window.innerWidth < MOBILE_BREAKPOINT) {
    return STYLES.position;
  }
  
  return type === 'bonus' 
    ? STYLES.desktopBonusPosition 
    : STYLES.desktopMaxVotesPosition;
};

const getTextContent = (type: 'bonus' | 'max-votes') => {
  if (type === 'bonus') {
    return {
      mobile: (
        <>
          <span className="block md:hidden">보너스 표는 2개가 모여야</span>
          <span className="block md:hidden"> 일반 표 1개와 같습니다.</span>
          <span className="hidden md:inline">보너스 표는 2개가 모여야 일반 표 1개와 같습니다.</span>
        </>
      )
    };
  }
  
  return {
    mobile: (
      <>
        <span className="block md:hidden">더 투표할까요?</span>
        <span className="hidden md:inline">더 투표하고 싶으신가요?</span>
      </>
    )
  };
};

const getTextClasses = (type: 'bonus' | 'max-votes') => {
  const baseClasses = 'flex flex-col font-["Pretendard",_sans-serif] font-normal justify-center text-[#000000]';
  const sizeClasses = type === 'bonus' 
    ? 'text-[11px] md:text-base' 
    : 'text-xs md:text-base';
  
  return `${baseClasses} ${sizeClasses}`;
};

const getLineHeightClasses = (type: 'bonus' | 'max-votes') => {
  return type === 'bonus' 
    ? 'leading-[14px] md:leading-[22px]' 
    : 'leading-[16px] md:leading-[22px]';
};

const getOverlayClasses = (type: 'bonus' | 'max-votes') => {
  const baseClasses = 'absolute inset-0 flex items-center justify-center';
  const positionClasses = type === 'bonus' 
    ? 'px-3 py-1 -translate-y-1 md:px-6 md:py-2' 
    : 'px-3 py-1 -translate-y-0.5 md:px-6 md:py-2 md:-translate-y-1';
  
  return `${baseClasses} ${positionClasses}`;
};

const getContainerClasses = (type: 'bonus' | 'max-votes') => {
  const baseClasses = 'relative w-max pointer-events-auto';
  const transformClasses = type === 'bonus' 
    ? 'translate-x-[5px] -translate-y-[5px]' 
    : '';
  
  return `${baseClasses} ${transformClasses}`.trim();
};

// Components
const TooltipBalloon = ({ type }: { type: 'bonus' | 'max-votes' }) => {
  const config = TOOLTIP_CONFIG[type];
  
  return (
    <>
      {/* Mobile balloon */}
      <img
        src="/icons/textBalloon.svg"
        alt="Text Balloon"
        height={50}
        width={config.mobileWidth}
        className="md:hidden"
        style={STYLES.tooltip}
      />
      
      {/* Desktop balloon */}
      <img
        src={config.image}
        alt="Text Balloon"
        height={55}
        className="w-auto h-auto hidden md:block"
        style={STYLES.tooltip}
      />
    </>
  );
};

const TooltipText = ({ type }: { type: 'bonus' | 'max-votes' }) => {
  const textContent = getTextContent(type);
  
  return (
    <div className={getOverlayClasses(type)}>
      <div className={getTextClasses(type)}>
        <p className={`whitespace-pre ${getLineHeightClasses(type)}`}>
          {textContent.mobile}
        </p>
      </div>
    </div>
  );
};

const HideButton = ({ onHide }: { onHide: () => void }) => (
  <div className="absolute top-1 right-1">
    <motion.button
      className="w-4 h-4 flex items-center justify-center cursor-pointer"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onHide}
    >
      <img
        src="/icons/voteSection-notify-hide.svg"
        alt="Hide Notification"
        className="w-full h-full"
      />
    </motion.button>
  </div>
);

// Main component
export default function TooltipPortal({ 
  type, 
  position, 
  onHide, 
  show 
}: TooltipPortalProps) {
  if (typeof window === 'undefined' || !show || position.x <= 0) {
    return null;
  }

  const config = TOOLTIP_CONFIG[type];
  const desktopPosition = getDesktopPosition(type);

  // 상대 위치를 그대로 사용하여 스크롤에 독립적으로 동작
  const topPosition = position.y + desktopPosition.top;

  return createPortal(
    <div 
      className="fixed pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${topPosition}px`,
        transform: desktopPosition.transform,
        zIndex: 9999999, // 헤더보다 확실히 높게 설정
      }}
    >
      <div className={getContainerClasses(type)}>
        <TooltipBalloon type={type} />
        <TooltipText type={type} />
        
        {config.showHideButton && onHide && (
          <HideButton onHide={onHide} />
        )}
      </div>
    </div>,
    document.body
  );
}
