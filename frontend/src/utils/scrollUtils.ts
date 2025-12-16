/**
 * 페이지를 맨 위로 스크롤
 */
export function scrollToTop(): void {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant',
  });

  // 추가 보장을 위한 document 요소 직접 설정
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}
