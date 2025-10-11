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
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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

  // 터치 시작 핸들러
  const handleTouchStart = (e: React.TouchEvent) => {
    if (readOnly) return;
    
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setIsDragging(true);
  };

  // 터치 종료 핸들러
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (readOnly || !isDragging) return;
    
    const touch = e.changedTouches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    
    // 별 컨테이너의 위치 정보 가져오기
    const starContainer = e.currentTarget as HTMLElement;
    const rect = starContainer.getBoundingClientRect();
    
    let finalRating = 0;
    
    // 터치 종료 위치에 따른 별점 결정
    if (touchX < rect.left) {
      // 왼쪽 바깥으로 나감 - 0점
      finalRating = 0;
      console.log('Touch ended left of container, finalRating = 0');
    } else if (touchX > rect.right) {
      // 오른쪽 바깥으로 나감 - 최대 점수
      finalRating = maxStars;
      console.log('Touch ended right of container, finalRating =', maxStars);
    } else if (touchY < rect.top || touchY > rect.bottom) {
      // 위아래로 벗어남 - 0점
      finalRating = 0;
      console.log('Touch ended above/below container, finalRating = 0');
    } else {
      // 별 컨테이너 내부에 있을 때 터치 위치로 별점 계산
      const { index, isHalf } = calculateRatingFromTouch(touchX, rect);
      finalRating = index + (isHalf ? 0.5 : 1);
      console.log('Touch ended inside container, finalRating =', finalRating);
    }
    
    console.log('Final rating check:', finalRating, '> 0?', finalRating > 0);
    
    // 0점이 아닐 때만 별점 제출
    if (finalRating > 0) {
      setRating(finalRating);
      onRatingChange?.(finalRating);
    }
    
    setIsDragging(false);
    setTouchStartX(null);
  };

  // 터치 위치로 별점 계산
  const calculateRatingFromTouch = (touchX: number, rect: DOMRect) => {
    // 별 컨테이너 내부에서의 상대 위치 계산
    const relativeX = touchX - rect.left;
    const containerWidth = rect.width;
    
    // 각 별의 너비 계산 (gap 포함)
    const starWidth = containerWidth / maxStars;
    
    // 터치 위치가 몇 번째 별에 해당하는지 계산
    const starIndex = Math.floor(relativeX / starWidth);
    
    // 별 내부에서의 위치 (0~1)
    const positionInStar = (relativeX % starWidth) / starWidth;
    
    // 반별점 여부 결정 (별의 왼쪽 절반이면 반별점)
    const isHalf = positionInStar < 0.5;
    
    // 별 인덱스가 0보다 작으면 0으로, maxStars보다 크면 maxStars-1로 제한
    const clampedIndex = Math.max(0, Math.min(starIndex, maxStars - 1));
    
    const finalRating = clampedIndex + (isHalf ? 0.5 : 1);
    
    console.log('calculateRatingFromTouch:', {
      touchX,
      rectLeft: rect.left,
      relativeX,
      containerWidth,
      starWidth,
      starIndex,
      positionInStar,
      isHalf,
      clampedIndex,
      finalRating
    });
    
    return {
      index: clampedIndex,
      isHalf: isHalf
    };
  };

  // 터치 이벤트 핸들러
  const handleTouchMove = (e: React.TouchEvent) => {
    if (readOnly || !isDragging) return;
    
    const touch = e.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;
    
    // 별 컨테이너의 위치 정보 가져오기
    const starContainer = e.currentTarget as HTMLElement;
    const rect = starContainer.getBoundingClientRect();
    
    // 터치가 별 컨테이너 영역을 벗어났는지 확인
    if (touchX < rect.left) {
      // 왼쪽 바깥으로 나감 - 모든 별 비우기
      setHoveredStar(null);
      setHoverRating(0);
      setRating(0);
      return;
    } else if (touchX > rect.right) {
      // 오른쪽 바깥으로 나감 - 모든 별 채우기
      setHoveredStar(maxStars - 1);
      setHoverRating(maxStars);
      setRating(maxStars);
      return;
    } else if (touchY < rect.top || touchY > rect.bottom) {
      // 위아래로 벗어남 - 모든 별 비우기
      setHoveredStar(null);
      setHoverRating(0);
      setRating(0);
      return;
    }
    
    // 별 컨테이너 내부에 있을 때 터치 위치로 별점 계산
    if (touchX >= rect.left && touchX <= rect.right && 
        touchY >= rect.top && touchY <= rect.bottom) {
      const { index, isHalf } = calculateRatingFromTouch(touchX, rect);
      const rating = index + (isHalf ? 0.5 : 1);
      
      console.log('handleTouchMove rating:', rating, '> 0?', rating > 0);
      
      // 0점이 아닐 때만 미리보기 표시
      if (rating > 0) {
        handleMouseEnter(index, isHalf);
      }
    }
  };

  return (
    <div 
      className="flex items-center gap-px" 
      style={{ cursor: 'default !important', touchAction: 'none' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
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
                  onTouchStart={() => handleMouseEnter(index, true)}
                  onTouchEnd={() => {
                    if (!isDragging) {
                      handleClick(index, true);
                    }
                  }}
                  style={{ touchAction: 'none' }}
                  aria-label={`${index + 0.5}점`}
                />
                {/* 전체별점 영역 (오른쪽 절반) */}
                <button
                  className="absolute right-0 top-0 w-1/2 h-full z-10 focus:outline-none cursor-pointer"
                  onMouseEnter={() => handleMouseEnter(index, false)}
                  onMouseLeave={() => handleMouseLeave(index)}
                  onClick={() => handleClick(index, false)}
                  onTouchStart={() => handleMouseEnter(index, false)}
                  onTouchEnd={() => {
                    if (!isDragging) {
                      handleClick(index, false);
                    }
                  }}
                  style={{ touchAction: 'none' }}
                  aria-label={`${index + 1}점`}
                />
              </>
            ) : (
              <button
                className="absolute inset-0 w-full h-full z-10 focus:outline-none cursor-pointer"
                onMouseEnter={() => handleMouseEnter(index, false)}
                onMouseLeave={() => handleMouseLeave(index)}
                onClick={() => handleClick(index, false)}
                onTouchStart={() => handleMouseEnter(index, false)}
                onTouchEnd={() => {
                  if (!isDragging) {
                    handleClick(index, false);
                  }
                }}
                style={{ touchAction: 'none' }}
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
