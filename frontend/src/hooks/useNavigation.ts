import { ScrollStateManager } from '@/lib';
import { useRouter } from 'next/navigation';

/**
 * 네비게이션 훅
 * 단일 책임: 페이지 간 이동 시 스크롤 상태 관리
 */
export const useNavigation = () => {
  const router = useRouter();
  const scrollManager = ScrollStateManager.getInstance();

  /**
   * 상세화면으로 이동 (스크롤 위치 저장)
   * @param animeId 애니메이션 ID
   */
  const navigateToDetail = (animeId: number) => {
    const currentPage = window.location.pathname;
    const pageKey = `search-${currentPage}`;

    // 즉시 스크롤 위치 저장 (네비게이션 전에)
    const scrollY = window.scrollY || 0;
    const documentScrollTop = document.documentElement.scrollTop || 0;
    const bodyScrollTop = document.body.scrollTop || 0;
    const currentScrollY = Math.max(scrollY, documentScrollTop, bodyScrollTop);

    // 플래그를 먼저 설정 (빠른 뒤로가기 대응)
    sessionStorage.setItem('from-anime-detail', 'true');
    sessionStorage.setItem('scroll-search-return', currentScrollY.toString());

    // 스크롤 위치 저장
    scrollManager.saveScrollPosition(pageKey);

    // 추가 보호: 지연 저장 (빠른 나가기 대응) - 처음 저장한 위치 그대로 사용
    setTimeout(() => {
      // 현재 스크롤 위치를 다시 확인하지 말고, 처음 저장한 위치를 그대로 사용
      scrollManager.saveScrollPositionAt(pageKey, currentScrollY);
      sessionStorage.setItem('scroll-search-return', currentScrollY.toString());
    }, 100);

    // 상세화면으로 이동
    router.push(`/animes/${animeId}`);
  };

  return {
    navigateToDetail,
  };
};
