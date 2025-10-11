'use client';

import StarRating from './StarRating';

interface StarRatingListProps {
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  withBackground?: boolean;
  maxStars?: number;
  showHalfStars?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  labelClassName?: string;
  containerClassName?: string;
}

export default function StarRatingList({
  title,
  description,
  size = 'md',
  withBackground = false,
  maxStars = 5,
  showHalfStars = true,
  onRatingChange,
  className = '',
  labelClassName = '',
  containerClassName = ''
}: StarRatingListProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {title && (
        <span className={`w-20 text-sm text-gray-600 ${labelClassName}`}>
          {title}:
        </span>
      )}
      <div className={`${containerClassName} pointer-events-auto`}>
        <StarRating
          maxStars={maxStars}
          size={size}
          withBackground={withBackground}
          showHalfStars={showHalfStars}
          onRatingChange={onRatingChange}
        />
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
}
