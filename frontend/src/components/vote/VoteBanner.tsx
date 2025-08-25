import Image from "next/image";
import { WeekDto } from "@/types/api";
import { getSeasonFromDate, getSeasonInKorean } from "@/lib/utils";

// Local banner asset paths
const duckstarLogo = "/banners/duckstar-logo.svg";
const star1 = "/banners/star-1.svg";
const star2 = "/banners/star-2.svg";

interface VoteBannerProps {
  weekDto?: WeekDto;
}

export default function VoteBanner({ weekDto }: VoteBannerProps) {
  // 기본값 설정
  const year = weekDto?.year || 2025;
  const startDate = weekDto?.startDate || "2025-07-13";
  const endDate = weekDto?.endDate || "2025-07-21";
  const quarter = weekDto?.quarter || 3;
  const week = weekDto?.week || 3;

  // 계절 계산
  const season = getSeasonFromDate(startDate);
  const seasonKorean = getSeasonInKorean(season);

  // 날짜 포맷팅 (YYYY/MM/DD)
  const formatDate = (dateString: string) => {
    return dateString.replace(/-/g, '/');
  };

  return (
    <div className="relative w-full h-24 bg-gradient-to-r from-[#212529] from-[14.927%] to-[#460e06] to-[85.889%] overflow-hidden">
      {/* 메인 컨텐츠 컨테이너 */}
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-2.5">
        {/* 텍스트 컨텐츠 */}
        <div className="flex flex-col items-center justify-center text-white text-center relative shrink-0">
          {/* 타이틀 */}
          <div className="flex flex-col justify-center mb-[-5px] relative shrink-0">
            <p className="font-[Pretendard] font-bold text-[33.833px] leading-tight whitespace-pre">
              {year} {seasonKorean} 애니메이션 투표
            </p>
          </div>

          {/* 날짜 */}
          <div className="flex flex-col justify-center relative shrink-0">
            <p className="font-[Pretendard] font-light text-[16px] tracking-[0.8px] leading-[22px]">
              {formatDate(startDate)} - {formatDate(endDate)} ({quarter}분기 {week}주차)
            </p>
          </div>
        </div>
      </div>

      {/* 왼쪽 D 아이콘 */}
      <div className="absolute top-[9.92px] left-[calc(50%-490px)] w-[88px] h-[79.164px]">
        <Image
          src={duckstarLogo}
          alt="Duckstar Logo"
          width={88}
          height={79.164}
          className="object-contain"
          priority
        />
      </div>

      {/* 오른쪽 별 컨테이너 */}
      <div className="absolute top-[-4px] right-[calc(50%-490px)] w-[121px] h-[99px]">
        <div className="relative w-full h-full aspect-[480/298]">
          {/* 첫 번째 별 */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: "-5.13%",
              right: "-33.52%",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <div className="flex-none rotate-[8.368deg] w-[147.837px] h-[147.837px]">
              <div className="relative w-full h-full">
                <div className="absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0">
                  <Image 
                    src={star1} 
                    alt="Star" 
                    width={147.837}
                    height={147.837}
                    className="object-contain" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 두 번째 별 */}
          <div
            className="absolute flex items-center justify-center"
            style={{
              left: "-33.82%",
              right: "-4.84%",
              top: "calc(50% + 16px)",
              transform: "translateY(-50%)",
            }}
          >
            <div className="flex-none rotate-[8.368deg] w-[147.837px] h-[147.837px]">
              <div className="relative w-full h-full">
                <div className="absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0">
                  <Image 
                    src={star2} 
                    alt="Star" 
                    width={147.837}
                    height={147.837}
                    className="object-contain" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
