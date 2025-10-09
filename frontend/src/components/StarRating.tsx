'use client';

import { useState } from 'react';
import Image from 'next/image';

interface StarRatingProps {
  maxStars?: number;
  initialRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showHalfStars?: boolean;
  withBackground?: boolean;
}

export default function StarRating({
  maxStars = 5,
  initialRating = 0,
  onRatingChange,
  size = 'md',
  showHalfStars = true,
  withBackground = false
}: StarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: 'size-5',
    md: 'size-7',
    lg: 'size-9'
  };

  const getStarIcon = (index: number) => {
    const currentRating = isHovering ? hoverRating : rating;
    const starValue = index + 1;
    const halfStarValue = index + 0.5;

    if (withBackground) {
      if (showHalfStars && currentRating >= halfStarValue && currentRating < starValue) {
        return '/icons/star/star-Half-Selected-with-bg.svg';
      } else if (currentRating >= starValue) {
        return '/icons/star/star-Selected.svg';
      } else {
        return '/icons/star/star-Unselected-with-bg.svg';
      }
    } else {
      if (showHalfStars && currentRating >= halfStarValue && currentRating < starValue) {
        return '/icons/star/star-Half-Selected.svg';
      } else if (currentRating >= starValue) {
        return '/icons/star/star-Selected.svg';
      } else {
        return '/icons/star/star-UnSelected.svg';
      }
    }
  };

  const handleMouseEnter = (index: number, isHalf: boolean = false) => {
    setIsHovering(true);
    setHoverRating(index + (isHalf ? 0.5 : 1));
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setHoverRating(0);
  };

  const handleClick = (index: number, isHalf: boolean = false) => {
    const newRating = index + (isHalf ? 0.5 : 1);
    setRating(newRating);
    onRatingChange?.(newRating);
  };

  return (
    <div 
      className="flex items-center gap-px"
      onMouseLeave={handleMouseLeave}
    >
      {Array.from({ length: maxStars }, (_, index) => (
        <div key={index} className={`${sizeClasses[size]} relative group`}>
          {showHalfStars ? (
            <>
              {/* 반별점 영역 (왼쪽 절반) */}
              <button
                className="absolute left-0 top-0 w-1/2 h-full z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onMouseEnter={() => handleMouseEnter(index, true)}
                onClick={() => handleClick(index, true)}
                aria-label={`${index + 0.5}점`}
              />
              {/* 전체별점 영역 (오른쪽 절반) */}
              <button
                className="absolute right-0 top-0 w-1/2 h-full z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                onMouseEnter={() => handleMouseEnter(index, false)}
                onClick={() => handleClick(index, false)}
                aria-label={`${index + 1}점`}
              />
            </>
          ) : (
            <button
              className="absolute inset-0 w-full h-full z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onMouseEnter={() => handleMouseEnter(index, false)}
              onClick={() => handleClick(index, false)}
              aria-label={`${index + 1}점`}
            />
          )}
          
          <div 
            className="transition-all duration-200 group-hover:scale-125 hover:scale-125"
            style={{ transform: 'scale(1)' }}
            onMouseEnter={(e) => {
              console.log(`별 ${index + 1} 호버 시작`);
              e.currentTarget.style.transform = 'scale(1.25)';
            }}
            onMouseLeave={(e) => {
              console.log(`별 ${index + 1} 호버 종료`);
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Image
              src={getStarIcon(index)}
              alt={`별 ${index + 1}`}
              width={size === 'sm' ? 20 : size === 'md' ? 28 : 36}
              height={size === 'sm' ? 20 : size === 'md' ? 28 : 36}
              className="w-full h-full"
              priority
            />
          </div>
        </div>
      ))}
    </div>
  );
}
