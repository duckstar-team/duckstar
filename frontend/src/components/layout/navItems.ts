// 공통 네비게이션 아이템 정의
export interface NavItem {
  label: string;
  href: string;
  defaultIcon: string;
  activeIcon: string;
  isBeta?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: '홈',
    href: '/',
    defaultIcon: '/icons/home-default.svg',
    activeIcon: '/icons/home-active.svg',
  },
  {
    label: '주간 차트',
    href: '/chart',
    defaultIcon: '/icons/chart-default.svg',
    activeIcon: '/icons/chart-active.svg',
  },
  {
    label: '투표하기',
    href: '/vote',
    defaultIcon: '/icons/vote-default.svg',
    activeIcon: '/icons/vote-active.svg',
  },
  {
    label: '애니/시간표 검색',
    href: '/search',
    defaultIcon: '/icons/search-default.svg',
    activeIcon: '/icons/search-active.svg',
  },
  {
    label: '덕스타 어워드',
    href: '/award',
    defaultIcon: '/icons/award-default.svg',
    activeIcon: '/icons/award-active.svg',
  },
  {
    label: '마이페이지',
    href: '/mypage',
    defaultIcon: '/icons/mypage-default.svg',
    activeIcon: '/icons/mypage-active.svg',
    isBeta: true,
  },
];
