import { WeekDto } from "@/types/api";
import { getSeasonFromDate, getSeasonInKorean } from "@/lib/utils";

// Types
interface VoteBannerProps {
  weekDto?: WeekDto;
  customTitle?: string;
  customSubtitle?: string;
  voteStartTime?: string; // 투표 시작시간 (예: "2025-01-06T18:00:00")
  voteEndTime?: string;   // 투표 마감시간 (예: "2025-01-13T18:00:00")
}

interface BannerData {
  year: number;
  startDate: string;
  endDate: string;
  quarter: number;
  week: number;
  season: string;
  seasonKorean: string;
}

// Constants
const ASSETS = {
  duckstarLogo: "/banners/duckstar-logo.svg",
  star1: "/banners/star-1.svg",
  star2: "/banners/star-2.svg",
} as const;

const BREAKPOINTS = {
  mobile: 320,
  desktop: 1200,
} as const;

const TYPOGRAPHY = {
  title: {
    mobile: 18,
    desktop: 33.833,
  },
} as const;

const STYLES = {
  container: "relative w-full h-24 bg-gradient-to-r from-[#212529] from-[14.927%] to-[#460e06] to-[85.889%] overflow-hidden",
  mainContent: "relative w-full h-full flex flex-col items-center justify-center gap-2.5",
  textContent: "flex flex-col items-center justify-center text-white text-center relative shrink-0",
  titleContainer: "flex flex-col justify-center mb-[-5px] relative shrink-0",
  title: "font-[Pretendard] font-bold leading-tight whitespace-pre text-lg sm:text-[33.833px]",
  dateContainer: "flex flex-col justify-center relative shrink-0",
  dateText: "font-[Pretendard] font-normal text-sm sm:text-[16px] tracking-[0.8px] leading-[22px]",
  dateTextMobile: "font-[Pretendard] font-normal text-sm sm:text-[16px] tracking-[0.8px] leading-[18px] -mt-1",
  dateTextDesktop: "font-[Pretendard] font-normal text-sm sm:text-[16px] tracking-[0.8px] leading-[22px]",
  duckstarLogoContainer: "absolute top-[9.92px] left-[calc(50%-490px)] w-[88px] h-[79.164px] hidden lg:block",
  starContainer: "absolute top-[-4px] right-[calc(50%-490px)] w-[121px] h-[99px] hidden lg:block",
  starWrapper: "relative w-full h-full aspect-[480/298]",
  starItem: "absolute flex items-center justify-center",
  starImage: "flex-none rotate-[8.368deg] w-[147.837px] h-[147.837px]",
  starImageWrapper: "relative w-full h-full",
  starImageContainer: "absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0",
} as const;

// Utility functions
const formatDate = (dateString: string): string => {
  return dateString.replace(/-/g, '/');
};

const getTitleFontSize = (): string => {
  const { mobile, desktop } = TYPOGRAPHY.title;
  const { mobile: mobileBreakpoint, desktop: desktopBreakpoint } = BREAKPOINTS;
  
  return `min(calc(${mobile}px + (${desktop} - ${mobile}) * ((100vw - ${mobileBreakpoint}px) / (${desktopBreakpoint} - ${mobileBreakpoint}))), ${desktop}px)`;
};

const getBannerData = (weekDto?: WeekDto): BannerData => {
  const year = weekDto?.year || 2025;
  const startDate = weekDto?.startDate || "2025-07-13";
  const endDate = weekDto?.endDate || "2025-07-21";
  const quarter = weekDto?.quarter || 3;
  const week = weekDto?.week || 3;

  const season = getSeasonFromDate(startDate);
  const seasonKorean = getSeasonInKorean(season);

  return {
    year,
    startDate,
    endDate,
    quarter,
    week,
    season,
    seasonKorean,
  };
};

const getTitleText = (bannerData: BannerData, customTitle?: string): string => {
  return customTitle || `${bannerData.year} ${bannerData.seasonKorean} 애니메이션 투표`;
};

const getDateText = (bannerData: BannerData, customSubtitle?: string, voteStartTime?: string, voteEndTime?: string): string => {
  if (customSubtitle) return customSubtitle;
  
  // 투표 시간이 제공되면 투표 시간을 표시
  if (voteStartTime && voteEndTime) {
    const startDate = new Date(voteStartTime);
    const endDate = new Date(voteEndTime);
    
    const formatDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}/${month}/${day}`;
    };
    
    return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
  }
  
  return `${formatDate(bannerData.startDate)} - ${formatDate(bannerData.endDate)}`;
};

const getQuarterWeekText = (bannerData: BannerData, customSubtitle?: string): string => {
  if (customSubtitle) return '';
  return `(${bannerData.quarter}분기 ${bannerData.week}주차)`;
};

const getFullDateText = (bannerData: BannerData, customSubtitle?: string, voteStartTime?: string, voteEndTime?: string): string => {
  if (customSubtitle) return customSubtitle;
  
  // 투표 시간이 제공되면 투표 시간을 표시
  if (voteStartTime && voteEndTime) {
    const startDate = new Date(voteStartTime);
    const endDate = new Date(voteEndTime);
    
    const formatDateTime = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}/${month}/${day}`;
    };
    
    return `${formatDateTime(startDate)} - ${formatDateTime(endDate)} (${bannerData.quarter}분기 ${bannerData.week}주차)`;
  }
  
  return `${formatDate(bannerData.startDate)} - ${formatDate(bannerData.endDate)} (${bannerData.quarter}분기 ${bannerData.week}주차)`;
};

// Components
const BannerTitle = ({ title }: { title: string }) => (
  <div className={STYLES.titleContainer}>
    <p 
      className={STYLES.title}
      style={{ fontSize: getTitleFontSize() }}
    >
      {title}
    </p>
  </div>
);

const BannerDate = ({ 
  dateText, 
  quarterWeekText, 
  fullDateText 
}: {
  dateText: string;
  quarterWeekText: string;
  fullDateText: string;
}) => (
  <div className={STYLES.dateContainer}>
    {/* Mobile: Two lines */}
    <p className={`${STYLES.dateText} sm:hidden`}>
      {dateText}
    </p>
    <p className={`${STYLES.dateTextMobile} sm:hidden`}>
      {quarterWeekText}
    </p>
    
    {/* Desktop: Single line */}
    <p className={`${STYLES.dateTextDesktop} hidden sm:block`}>
      {fullDateText}
    </p>
  </div>
);

const DuckstarLogo = () => (
  <div className={STYLES.duckstarLogoContainer}>
    <img
      src={ASSETS.duckstarLogo}
      alt="Duckstar Logo"
      className="w-full h-full object-contain"
    />
  </div>
);

const StarImage = ({ src, alt }: { src: string; alt: string }) => (
  <div className={STYLES.starImage}>
    <div className={STYLES.starImageWrapper}>
      <div className={STYLES.starImageContainer}>
        <img 
          src={src} 
          alt={alt} 
          className="object-contain w-full h-full" 
        />
      </div>
    </div>
  </div>
);

const StarContainer = () => (
  <div className={STYLES.starContainer}>
    <div className={STYLES.starWrapper}>
      {/* First star */}
      <div
        className={STYLES.starItem}
        style={{
          left: "-5.13%",
          right: "-33.52%",
          top: "50%",
          transform: "translateY(-50%)",
        }}
      >
        <StarImage src={ASSETS.star1} alt="Star" />
      </div>

      {/* Second star */}
      <div
        className={STYLES.starItem}
        style={{
          left: "-33.82%",
          right: "-4.84%",
          top: "calc(50% + 16px)",
          transform: "translateY(-50%)",
        }}
      >
        <StarImage src={ASSETS.star2} alt="Star" />
      </div>
    </div>
  </div>
);

const BannerContent = ({ 
  title, 
  dateText, 
  quarterWeekText, 
  fullDateText 
}: {
  title: string;
  dateText: string;
  quarterWeekText: string;
  fullDateText: string;
}) => (
  <div className={STYLES.mainContent}>
    <div className={STYLES.textContent}>
      <BannerTitle title={title} />
      <BannerDate 
        dateText={dateText}
        quarterWeekText={quarterWeekText}
        fullDateText={fullDateText}
      />
    </div>
  </div>
);

// Main component
export default function VoteBanner({ 
  weekDto, 
  customTitle, 
  customSubtitle,
  voteStartTime,
  voteEndTime
}: VoteBannerProps) {
  const bannerData = getBannerData(weekDto);
  const title = getTitleText(bannerData, customTitle);
  const dateText = getDateText(bannerData, customSubtitle, voteStartTime, voteEndTime);
  const quarterWeekText = getQuarterWeekText(bannerData, customSubtitle);
  const fullDateText = getFullDateText(bannerData, customSubtitle, voteStartTime, voteEndTime);

  return (
    <div className={STYLES.container}>
      <BannerContent
        title={title}
        dateText={dateText}
        quarterWeekText={quarterWeekText}
        fullDateText={fullDateText}
      />
      <DuckstarLogo />
      <StarContainer />
    </div>
  );
}
