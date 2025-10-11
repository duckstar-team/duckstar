'use client';


interface StarRatingDisplayProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function StarRatingDisplay({
  rating,
  maxStars = 5,
  size = 'sm',
  className = ''
}: StarRatingDisplayProps) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-5',
    lg: 'size-6'
  };

  const imageSize = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className={`flex items-center gap-px ${className}`}>
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = index + 1;
        const fillPercentage = Math.max(0, Math.min(1, rating - index));
        
        return (
          <div 
            key={index} 
            className={`${sizeClasses[size]} relative`}
          >
            {/* UnSelected SVG (배경) */}
            <img
              src="/icons/star/star-UnSelected.svg"
              alt="별"
              className="w-full h-full"
            />
            
            {/* Selected SVG (마스킹) */}
            {fillPercentage > 0 && (
              <div 
                className="absolute inset-0"
                style={{
                  clipPath: `inset(0 ${100 - (fillPercentage * 100)}% 0 0)`
                }}
              >
                <img
                  src="/icons/star/star-Selected.svg"
                  alt="별"
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
