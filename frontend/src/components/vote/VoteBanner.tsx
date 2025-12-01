import { WeekDto } from '@/types/api';
import { getSeasonFromDate, getSeasonInKorean } from '@/lib/utils';
import { format } from 'date-fns';

// Types
interface VoteBannerProps {
  weekDto?: WeekDto;
  customTitle?: string;
  customSubtitle?: string;
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
  container:
    'relative w-full h-24 bg-gradient-to-r from-[#212529] from-[14.927%] to-[#460e06] to-[85.889%] overflow-hidden',
  mainContent:
    'relative w-full h-full flex flex-col items-center justify-center gap-2.5',
  textContent:
    'flex flex-col items-center justify-center text-white text-center relative shrink-0 gap-[5px]',
  titleContainer: 'flex flex-col justify-center mb-[-5px] relative shrink-0',
  title: ' font-bold leading-tight whitespace-pre text-lg sm:text-[33.833px]',
  dateContainer: 'flex items-center gap-1 justify-center relative shrink-0',
  dateText:
    ' font-normal text-sm sm:text-[16px] tracking-[0.8px] leading-[22px]',
  dateTextMobile:
    'font-normal text-sm sm:text-[16px] tracking-[0.8px] leading-[18px] -mt-1',
  dateTextDesktop:
    ' font-normal text-sm sm:text-[16px] tracking-[0.8px] leading-[22px]',
  duckstarLogoContainer:
    'absolute top-[9.92px] left-[calc(50%-490px)] w-[88px] h-[79.164px] hidden lg:block',
  starContainer:
    'absolute top-[-4px] right-[calc(50%-490px)] w-[121px] h-[99px] hidden lg:block',
  starWrapper: 'relative w-full h-full aspect-[480/298]',
  starItem: 'absolute flex items-center justify-center',
  starImage: 'flex-none rotate-[8.368deg] w-[147.837px] h-[147.837px]',
  starImageWrapper: 'relative w-full h-full',
  starImageContainer:
    'absolute bottom-[9.55%] left-[2.45%] right-[2.45%] top-0 z-10',
} as const;

const getTitleFontSize = (): string => {
  const { mobile, desktop } = TYPOGRAPHY.title;
  const { mobile: mobileBreakpoint, desktop: desktopBreakpoint } = BREAKPOINTS;

  return `min(calc(${mobile}px + (${desktop} - ${mobile}) * ((100vw - ${mobileBreakpoint}px) / (${desktopBreakpoint} - ${mobileBreakpoint}))), ${desktop}px)`;
};

const getBannerData = (weekDto?: WeekDto): BannerData => {
  const year = weekDto?.year || 2025;
  const startDate = weekDto?.startDate || '2025-07-13';
  const endDate = weekDto?.endDate || '2025-07-21';
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
  return (
    customTitle ||
    `${bannerData.year} ${bannerData.seasonKorean} 애니메이션 투표`
  );
};

const getDateText = (
  bannerData: BannerData,
  customSubtitle?: string
): string => {
  if (customSubtitle) return customSubtitle;
  return `${format(bannerData.startDate, 'yyyy/MM/dd')} - ${format(
    bannerData.endDate,
    'yyyy/MM/dd'
  )}`;
};

const getQuarterWeekText = (
  bannerData: BannerData,
  customSubtitle?: string
): string => {
  if (customSubtitle) return '';
  return `(${bannerData.quarter}분기 ${bannerData.week}주차)`;
};

const getFullDateText = (
  bannerData: BannerData,
  customSubtitle?: string
): string => {
  if (customSubtitle) return customSubtitle;
  return `${format(bannerData.startDate, 'yyyy/MM/dd')} - ${format(
    bannerData.endDate,
    'yyyy/MM/dd'
  )} (${bannerData.quarter}분기 ${bannerData.week}주차)`;
};

// Components
const BannerTitle = ({ title }: { title: string }) => (
  <div className={STYLES.titleContainer}>
    <p className={STYLES.title} style={{ fontSize: getTitleFontSize() }}>
      {title}
    </p>
  </div>
);

const BannerDate = ({
  dateText,
  quarterWeekText,
  fullDateText,
}: {
  dateText: string;
  quarterWeekText: string;
  fullDateText: string;
}) => (
  <div className={STYLES.dateContainer}>
    {/* Mobile: Two lines */}
    <p className={`${STYLES.dateText} sm:hidden`}>{dateText}</p>
    <p className={`${STYLES.dateTextMobile} sm:hidden`}>{quarterWeekText}</p>

    {/* Desktop: Single line */}
    <p className={`${STYLES.dateTextDesktop} hidden sm:block`}>
      {fullDateText}
    </p>
  </div>
);

const BannerContent = ({
  title,
  dateText,
  quarterWeekText,
  fullDateText,
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
}: VoteBannerProps) {
  const bannerData = getBannerData(weekDto);
  const title = getTitleText(bannerData, customTitle);
  const dateText = getDateText(bannerData, customSubtitle);
  const quarterWeekText = getQuarterWeekText(bannerData, customSubtitle);
  const fullDateText = getFullDateText(bannerData, customSubtitle);

  return (
    <div className="relative h-24 w-full overflow-hidden bg-[url(/banners/vote-banner-mobile.svg)] bg-cover bg-center xl:bg-[url(/banners/vote-banner.svg)]">
      <BannerContent
        title={title}
        dateText={dateText}
        quarterWeekText={quarterWeekText}
        fullDateText={fullDateText}
      />
    </div>
  );
}
