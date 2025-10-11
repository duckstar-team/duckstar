'use client';

interface BannerImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

export default function BannerImage({ 
  src,
  alt = "애니메이션 캐릭터 이미지",
  className = ""
}: BannerImageProps) {
  return (
    <div 
      className={`w-[326px] h-[215px] right-0 top-0 absolute overflow-hidden rounded-r-xl ${className}`}
    >
      <div 
        className="w-full h-full overflow-hidden rounded-r-[14px]"
        style={{
          clipPath: 'inset(1px 1px 1px 0)' // 위아래 1px씩 더 자르기
        }}
      >
        <img 
          className="w-full h-full object-cover"
          src={src}
          alt={alt}
        />
      </div>
    </div>
  );
}
