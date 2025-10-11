'use client';

import { useState, useRef } from 'react';

interface StarRatingSimpleProps {
  maxStars?: number;
  initialRating?: number;
  onRatingChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showHalfStars?: boolean;
  withBackground?: boolean;
  readOnly?: boolean;
}

export default function StarRatingSimple({
  maxStars = 5,
  initialRating = 0,
  onRatingChange,
  size = 'md',
  showHalfStars = true,
  withBackground = false,
  readOnly = false
}: StarRatingSimpleProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sizeClasses = {
    sm: 'size-5',
    md: 'size-8',  // md와 lg 사이 (size-7 → size-8)
    lg: 'size-9'
  };

  const getStarIcon = (index: number) => {
    const currentRating = hoverRating || rating;
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
    // 기존 타이머 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setHoverRating(index + (isHalf ? 0.5 : 1));
    setHoveredStar(index);
  };

  const handleMouseLeave = (index: number) => {
    // 기존 타이머 취소
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 지연을 두어 깜빡임 방지
    timeoutRef.current = setTimeout(() => {
      setHoverRating(0);
      setHoveredStar(null);
    }, 100);
  };

  const handleClick = (index: number, isHalf: boolean = false) => {
    const newRating = index + (isHalf ? 0.5 : 1);
    setRating(newRating);
    onRatingChange?.(newRating);
  };

  return (
    <div 
      className="flex items-center gap-px" 
      style={{ cursor: 'default !important' }}
    >
      {Array.from({ length: maxStars }, (_, index) => (
        <div 
          key={index} 
          className={`${sizeClasses[size]} relative`}
          style={{ cursor: 'default !important' }}
        >
          {!readOnly && (
            showHalfStars ? (
              <>
                {/* 반별점 영역 (왼쪽 절반) */}
                <button
                  className="absolute left-0 top-0 w-1/2 h-full z-10 focus:outline-none cursor-pointer"
                  onMouseEnter={() => handleMouseEnter(index, true)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  onClick={() => handleClick(index, true)}
                  aria-label={`${index + 0.5}점`}
                />
                {/* 전체별점 영역 (오른쪽 절반) */}
                <button
                  className="absolute right-0 top-0 w-1/2 h-full z-10 focus:outline-none cursor-pointer"
                  onMouseEnter={() => handleMouseEnter(index, false)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  onClick={() => handleClick(index, false)}
                  aria-label={`${index + 1}점`}
                />
              </>
            ) : (
              <button
                className="absolute inset-0 w-full h-full z-10 focus:outline-none cursor-pointer"
                onMouseEnter={() => handleMouseEnter(index, false)}
                onMouseLeave={() => handleMouseLeave(index)}
                onClick={() => handleClick(index, false)}
                aria-label={`${index + 1}점`}
              />
            )
          )}
          
          {/* 별 이미지 - 강제 호버 효과 */}
          <div 
            className="transition-transform duration-200 ease-in-out"
            style={{
              transform: hoveredStar === index ? 'scale(1.25)' : 'scale(1)',
              transformOrigin: 'center',
              willChange: 'transform'
            }}
          >
            <img
              src={getStarIcon(index)}
              alt={`별 ${index + 1}`}
              className="w-full h-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
