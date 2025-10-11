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
    <>
      {/* 모바일용 이미지 */}
      <div 
        className={`md:hidden w-full h-[200px] overflow-hidden rounded-t-xl ${className}`}
      >
        <img 
          className="w-full h-full object-cover"
          src={src}
          alt={alt}
        />
      </div>
      
      {/* 데스크톱용 이미지 */}
      <div 
        className={`hidden md:block w-[326px] h-[215px] absolute right-0 top-0 overflow-hidden rounded-r-xl ${className}`}
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
    </>
  );
}
