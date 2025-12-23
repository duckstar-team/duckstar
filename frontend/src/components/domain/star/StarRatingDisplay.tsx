interface StarRatingDisplayProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  responsiveSize?: boolean;
  className?: string;
}

export default function StarRatingDisplay({
  rating,
  maxStars = 5,
  size = 'sm',
  responsiveSize = false,
  className = '',
}: StarRatingDisplayProps) {
  const sizeClasses = {
    sm: responsiveSize ? 'size-3 xs:size-4 sm:size-4' : 'size-4',
    md: responsiveSize ? 'size-4 xs:size-5 sm:size-5' : 'size-5',
    lg: responsiveSize ? 'size-5 xs:size-6 sm:size-6' : 'size-6',
  };

  const imageSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <div className={`flex items-center gap-px ${className}`}>
      {Array.from({ length: maxStars }, (_, index) => {
        const starValue = (index + 1) * 2; // 10점 만점에서 별 하나당 2점씩
        const fillPercentage = Math.max(
          0,
          Math.min(1, (rating - index * 2) / 2)
        );

        return (
          <div key={index} className={`${sizeClasses[size]} relative`}>
            {/* UnSelected SVG (배경) */}
            <img
              src="/icons/star/star-UnSelected.svg"
              alt="별"
              className="h-full w-full"
            />

            {/* Selected SVG (마스킹) */}
            {fillPercentage > 0 && (
              <div
                className="absolute inset-0"
                style={{
                  clipPath: `inset(0 ${100 - fillPercentage * 100}% 0 0)`,
                }}
              >
                <img
                  src="/icons/star/star-Selected.svg"
                  alt="별"
                  className="h-full w-full"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
