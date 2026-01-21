interface BannerContentProps {
  header: string;
  title: string;
  source: string;
}

export default function BannerContent({
  header,
  title,
  source,
}: BannerContentProps) {
  return (
    <div className="absolute top-[16px] left-[20px]">
      {/* 헤더 */}
      <div className="mb-1.5 justify-start text-lg font-semibold">{header}</div>

      {/* 제목과 소스 - 세로 리스트 */}
      <div className="flex flex-col gap-[8px] pl-[23px]">
        {/* 제목 */}
        <div className="w-60 sm:w-80">
          <div className="justify-start text-xl font-bold sm:text-2xl">
            {title.split(', ').map((line, index) => (
              <span key={index}>
                {line}
                {index === 0 && <br />}
              </span>
            ))}
          </div>
        </div>

        {/* 소스 */}
        <div>
          <div className="justify-start text-base font-normal text-gray-400">
            {source}
          </div>
        </div>
      </div>
    </div>
  );
}
