// 공통 네비게이션 아이템 정의
export interface NavItem {
  label: string;
  href: string;
  defaultIcon: string;
  activeIcon: string;
  iconSize?: string;
  iconClass?: string;
  isBeta?: boolean;
  badgeText?: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: '홈',
    href: '/',
    defaultIcon: '/icons/home-default.svg',
    activeIcon: '/icons/home-active.svg',
    iconSize: 'size-5',
    iconClass: 'flex items-center justify-center size-full',
    isBeta: false,
  },
  {
    label: '주간 차트',
    href: '/chart',
    defaultIcon: '/icons/chart-default.svg',
    activeIcon: '/icons/chart-active.svg',
    iconSize: 'size-5',
    iconClass: 'flex items-center justify-center size-full',
    isBeta: false,
  },
  {
    label: '투표하기',
    href: '/vote',
    defaultIcon: '/icons/vote-default.svg',
    activeIcon: '/icons/vote-active.svg',
    iconSize: 'size-5',
    iconClass: 'flex items-center justify-center size-full',
    isBeta: false,
  },
  {
    label: '애니/시간표 검색',
    href: '/search',
    defaultIcon: '/icons/search-default.svg',
    activeIcon: '/icons/search-active.svg',
    iconSize: 'size-5',
    iconClass: 'flex items-center justify-center size-full',
    isBeta: false,
  },
  {
    label: '마이페이지',
    href: '/mypage',
    defaultIcon: '/icons/mypage-default.svg',
    activeIcon: '/icons/mypage-active.svg',
    iconSize: 'size-5',
    iconClass: 'flex items-center justify-center size-full',
    isBeta: true,
    badgeText: '준비중',
  },
];
