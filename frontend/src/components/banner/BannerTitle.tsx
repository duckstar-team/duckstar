'use client';

interface BannerTitleProps {
  title?: string;
  className?: string;
}

export default function BannerTitle({ 
  title = "내가 연인이 될 수 있을 리 없잖아, 무리무리! (※무리가 아니었다?!)",
  className = ""
}: BannerTitleProps) {
  return (
    <div className={`w-80 ${className}`}>
      <div className="justify-start text-black text-2xl font-bold font-['Pretendard']">
        {title.split(', ').map((line, index) => (
          <span key={index}>
            {line}
            {index === 0 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}
