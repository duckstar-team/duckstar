'use client';

interface BannerSourceProps {
  source?: string;
  date?: string;
  className?: string;
}

export default function BannerSource({ 
  source = "Anilab",
  date = "9/21 기준",
  className = ""
}: BannerSourceProps) {
  return (
    <div className={`${className}`}>
      <div className="justify-start text-gray-400 text-base font-normal font-['Pretendard']">
        {source}, {date}
      </div>
    </div>
  );
}
