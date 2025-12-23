'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Types
interface ConfettiEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

// Constants
const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'] as const;

const CONFETTI_CONFIG = {
  desktop: {
    count: 50,
    minSize: 8,
    maxSize: 20,
  },
  mobile: {
    count: 40,
    minSize: 7,
    maxSize: 11,
  },
} as const;

const MOBILE_BREAKPOINT = 768;

// Utility functions
const getConfettiConfig = () => {
  if (typeof window === 'undefined') return CONFETTI_CONFIG.desktop;
  return window.innerWidth < MOBILE_BREAKPOINT ? CONFETTI_CONFIG.mobile : CONFETTI_CONFIG.desktop;
};

const generateConfettiPieces = (): ConfettiPiece[] => {
  const config = getConfettiConfig();
  const pieces: ConfettiPiece[] = [];
  
  for (let i = 0; i < config.count; i++) {
    pieces.push({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * 100,
      rotation: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: config.minSize + Math.random() * (config.maxSize - config.minSize),
      delay: Math.random() * 0.5
    });
  }
  
  return pieces;
};

// Main component
export default function ConfettiEffect({ isActive, onComplete }: ConfettiEffectProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  useEffect(() => {
    if (isActive) {
      // 빵빠레 조각들 생성
      const pieces = generateConfettiPieces();
      setConfetti(pieces);

      // 애니메이션 완료 후 콜백 호출
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setConfetti([]);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confetti.map((piece) => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: piece.x,
            top: piece.y,
            width: piece.size,
            height: piece.size,
            backgroundColor: piece.color,
            borderRadius: '2px'
          }}
          initial={{ 
            y: piece.y,
            rotate: piece.rotation,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 100,
            rotate: piece.rotation + 360 * 3,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 3,
            delay: piece.delay,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}
