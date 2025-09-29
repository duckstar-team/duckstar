# useAdvancedScrollRestoration 훅 사용 가이드

## 개요

`useAdvancedScrollRestoration`은 검색화면에서 사용되던 정교한 스크롤 저장/복원 로직을 재사용 가능한 훅으로 추출한 것입니다. 이 훅은 다양한 네비게이션 시나리오에서 스크롤 위치를 정확하게 관리합니다.

## 주요 기능

- **네비게이션 타입별 스크롤 처리**: 사이드바, 로고, 상세화면에서 돌아오기 등
- **즉시 스크롤 복원**: 깜빡임 방지를 위한 다중 복원 방식
- **다중 스크롤 컨테이너 지원**: window, main 요소 등
- **세션 스토리지 기반 상태 관리**: 페이지별 독립적인 스크롤 관리
- **데이터 로딩 완료 후 스크롤 복원**: 비동기 데이터 로딩 고려

## 기본 사용법

```tsx
import { useAdvancedScrollRestoration } from '@/hooks/useAdvancedScrollRestoration';

function MyPage() {
  const {
    saveScrollPosition,
    restoreScrollPosition,
    navigateWithScroll,
    navigateBackWithScroll,
    findScrollContainer,
    scrollToPosition,
    scrollToTop
  } = useAdvancedScrollRestoration({
    enabled: true,
    scrollKey: 'my-page',
    saveDelay: 100,
    restoreDelay: 10,
    restoreAfterDataLoad: true,
    containerSelector: 'main',
    navigationTypes: {
      sidebar: 'sidebar-navigation',
      logo: 'logo-navigation',
      detail: 'from-detail'
    }
  });

  // 컴포넌트 로직...
}
```

## 옵션 설정

### ScrollRestorationOptions

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | boolean | true | 스크롤 복원 활성화 여부 |
| `scrollKey` | string | pathname | 페이지별 스크롤 키 |
| `saveDelay` | number | 100 | 스크롤 저장 지연 시간 (ms) |
| `restoreDelay` | number | 10 | 스크롤 복원 지연 시간 (ms) |
| `restoreAfterDataLoad` | boolean | true | 데이터 로딩 완료 후 스크롤 복원 여부 |
| `containerSelector` | string | 'main' | 스크롤 컨테이너 선택자 |
| `navigationTypes` | object | - | 네비게이션 타입별 플래그 키 |

### navigationTypes 옵션

```tsx
navigationTypes: {
  sidebar: 'sidebar-navigation',    // 사이드바 네비게이션 플래그
  logo: 'logo-navigation',          // 로고 네비게이션 플래그
  detail: 'from-detail'              // 상세화면에서 돌아오기 플래그
}
```

## 반환값

### ScrollRestorationReturn

| 함수 | 타입 | 설명 |
|------|------|------|
| `saveScrollPosition` | () => void | 현재 스크롤 위치 저장 |
| `restoreScrollPosition` | () => void | 저장된 스크롤 위치 복원 |
| `navigateWithScroll` | (url: string) => void | 스크롤 저장 후 네비게이션 |
| `navigateBackWithScroll` | () => void | 뒤로가기와 함께 스크롤 복원 |
| `findScrollContainer` | () => HTMLElement \| Window | 스크롤 컨테이너 찾기 |
| `scrollToPosition` | (y: number, behavior?: ScrollBehavior) => void | 특정 위치로 스크롤 |
| `scrollToTop` | () => void | 맨 위로 스크롤 |

## 사용 예시

### 1. 기본 페이지에서 사용

```tsx
function HomePage() {
  const { scrollToTop, navigateWithScroll } = useAdvancedScrollRestoration({
    scrollKey: 'home',
    navigationTypes: {
      sidebar: 'sidebar-nav',
      logo: 'logo-nav',
      detail: 'from-anime-detail'
    }
  });

  const handleNavigation = (url: string) => {
    navigateWithScroll(url);
  };

  return (
    <div>
      <button onClick={() => scrollToTop()}>맨 위로</button>
      <button onClick={() => handleNavigation('/search')}>검색으로</button>
    </div>
  );
}
```

### 2. 검색 페이지에서 사용 (기존 구현)

```tsx
function SearchPage() {
  const {
    saveScrollPosition,
    restoreScrollPosition,
    navigateWithScroll,
    findScrollContainer,
    scrollToPosition,
    scrollToTop
  } = useAdvancedScrollRestoration({
    enabled: true,
    scrollKey: 'search',
    saveDelay: 100,
    restoreDelay: 10,
    restoreAfterDataLoad: true,
    containerSelector: 'main',
    navigationTypes: {
      sidebar: 'sidebar-navigation',
      logo: 'logo-navigation',
      detail: 'from-anime-detail'
    }
  });

  // 스크롤 섹션 이동 함수
  const scrollToSection = (sectionId: string) => {
    if (sectionId === 'top' || sectionId === 'upcoming') {
      scrollToTop();
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 60;
      const daySelectionHeight = 44;
      const margin = 70;
      
      const targetY = element.offsetTop - headerHeight - daySelectionHeight - margin;
      scrollToPosition(Math.max(0, targetY), 'smooth');
    }
  };

  // 컴포넌트 로직...
}
```

### 3. 애니메이션 상세 페이지에서 사용

```tsx
function AnimeDetailPage() {
  const { navigateBackWithScroll } = useAdvancedScrollRestoration({
    scrollKey: 'search', // 검색 페이지로 돌아갈 때
    navigationTypes: {
      detail: 'from-anime-detail'
    }
  });

  const handleBackToSearch = () => {
    // 검색 페이지의 스크롤 위치를 저장하고 뒤로가기
    navigateBackWithScroll();
  };

  return (
    <div>
      <button onClick={handleBackToSearch}>검색으로 돌아가기</button>
    </div>
  );
}
```

## 유틸리티 함수

훅과 함께 제공되는 유틸리티 함수들:

```tsx
import { scrollUtils } from '@/hooks/useAdvancedScrollRestoration';

// 맨 위로 스크롤
scrollUtils.scrollToTop();

// 특정 위치로 스크롤
scrollUtils.scrollToPosition(500, 'smooth');

// 스크롤 위치 저장
scrollUtils.saveScrollPosition('my-page');

// 스크롤 위치 복원
scrollUtils.restoreScrollPosition('my-page');

// 스토리지 플래그 정리
scrollUtils.clearStorageFlags('flag1', 'flag2', 'flag3');
```

## 네비게이션 플래그 설정

다른 페이지에서 이 훅을 사용할 때는 적절한 네비게이션 플래그를 설정해야 합니다:

```tsx
// 사이드바 네비게이션
sessionStorage.setItem('sidebar-navigation', 'true');

// 로고 네비게이션
sessionStorage.setItem('logo-navigation', 'true');

// 상세화면에서 돌아오기
sessionStorage.setItem('from-anime-detail', 'true');
```

## 주의사항

1. **스크롤 키**: 각 페이지마다 고유한 `scrollKey`를 사용해야 합니다.
2. **네비게이션 플래그**: 페이지 간 이동 시 적절한 플래그를 설정해야 합니다.
3. **컨테이너 선택자**: 페이지의 스크롤 컨테이너에 맞게 설정해야 합니다.
4. **데이터 로딩**: 비동기 데이터가 있는 경우 `restoreAfterDataLoad: true`를 사용하세요.

## 마이그레이션 가이드

기존의 복잡한 스크롤 로직을 이 훅으로 마이그레이션하는 방법:

1. **기존 스크롤 로직 제거**: 복잡한 useEffect와 스크롤 관련 함수들을 제거
2. **훅 추가**: `useAdvancedScrollRestoration` 훅을 추가하고 적절한 옵션 설정
3. **함수 교체**: 기존 스크롤 함수들을 훅에서 제공하는 함수로 교체
4. **테스트**: 다양한 네비게이션 시나리오에서 스크롤 복원이 정상 작동하는지 확인

이 훅을 사용하면 복잡한 스크롤 관리 로직을 간단하게 처리할 수 있으며, 여러 페이지에서 일관된 스크롤 경험을 제공할 수 있습니다.
