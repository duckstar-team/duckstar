'use client';

interface BannerHeaderProps {
  text?: string;
  className?: string;
}

export default function BannerHeader({
  text = '🔥 HOT 급상승 애니메이션',
  className = '',
}: BannerHeaderProps) {
  return (
    <div className={`h-5 ${className}`}>
      <div className="justify-start text-lg leading-snug font-semibold text-black">
        {text}
      </div>
    </div>
  );
}
