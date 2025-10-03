import { useEffect } from 'react';
import ScrollStateManager from '@/lib/scrollStateManager';

/**
 * 스크롤 복원 훅
 * 단일 책임: 페이지 로드 시 스크롤 위치 복원
 * @param pageKey 페이지 식별자
 * @param dependencies 복원 시점을 결정하는 의존성 배열
 */
export const useScrollRestore = (
  pageKey: string, 
  dependencies: any[] = []
) => {
  const scrollManager = ScrollStateManager.getInstance();
  
  useEffect(() => {
    console.log(`🔄 useScrollRestore 실행: ${pageKey}`);
    console.log(`🔄 hasPosition 체크: ${scrollManager.hasPosition(pageKey)}`);
    
    // 스크롤 위치가 있는 경우에만 복원
    if (scrollManager.hasPosition(pageKey)) {
      console.log(`🔄 useScrollRestore 복원 시작: ${pageKey}`);
      
      // CSS scroll-behavior 강제 무시
      const originalScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
      
      // 즉시 스크롤 복원
      scrollManager.restoreScrollPosition(pageKey);
      
      // 추가 복원 (확실하게)
      setTimeout(() => {
        scrollManager.restoreScrollPosition(pageKey);
        console.log(`🔄 useScrollRestore 지연 복원: ${pageKey}`);
      }, 50);
      
      // CSS 복원
      setTimeout(() => {
        document.documentElement.style.scrollBehavior = originalScrollBehavior;
        document.body.style.scrollBehavior = originalScrollBehavior;
      }, 100);
      
      // 정리
      setTimeout(() => {
        scrollManager.clearPosition(pageKey);
        console.log(`🔄 useScrollRestore 정리 완료: ${pageKey}`);
      }, 200);
    } else {
      console.log(`⚠️ useScrollRestore 스크롤 위치 없음: ${pageKey}`);
    }
  }, dependencies);
};
