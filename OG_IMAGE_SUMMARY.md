# OG 이미지 정리 요약

## 📋 현재 상태

### ✅ 존재하는 OG 이미지 파일들
- `frontend/public/banners/og-logo.jpg` (13K, 1200x630) - **주로 사용됨**
- `frontend/public/banners/og-logo.png` (65K, 1200x630)
- `frontend/public/banners/og-logo.webp` (8.4K)

### ❌ 존재하지 않는 파일
- `frontend/public/banners/og-logo.svg` - 코드에서 참조하지만 파일 없음

### 📦 백업 파일
- `og-logo.jpg.backup` (13K) - 이전 버전
- `og-logo.png.backup` (18K) - 이전 버전

---

## 🔍 코드에서 사용되는 위치

### 1. 메인 페이지 (`frontend/src/app/page.tsx`)
```typescript
images: [{
  url: getOgLogoUrl('jpg'),  // og-logo.jpg 사용
  width: 1200,
  height: 630,
}]
```

### 2. 검색 페이지 (`frontend/src/app/search/layout.tsx`)
```typescript
images: [getOgLogoUrl('jpg')]  // og-logo.jpg 사용
```

### 3. 차트 페이지 (`frontend/src/app/chart/layout.tsx`)
```typescript
images: [getOgLogoUrl('jpg')]  // og-logo.jpg 사용
```

### 4. 투표 페이지 (`frontend/src/app/vote/layout.tsx`)
```typescript
images: [getOgLogoUrl('jpg')]  // og-logo.jpg 사용
```

### 5. 애니메이션 상세 페이지 (`frontend/src/lib/ogImage.ts`)
- 이미지가 없을 때 폴백으로 `og-logo.jpg` 사용
- 애니메이션 썸네일이 있으면 변환 API 사용

---

## 📝 교체 가이드

### 필요한 파일
1. **`og-logo.jpg`** (필수) - 1200x630, JPG 형식
   - 가장 많이 사용됨
   - 모든 페이지의 기본 OG 이미지

2. **`og-logo.png`** (선택) - 1200x630, PNG 형식
   - 투명도가 필요한 경우

3. **`og-logo.webp`** (선택) - 1200x630, WebP 형식
   - 최적화된 버전

4. **`og-logo.svg`** (선택) - SVG 형식
   - 코드에서 참조하지만 현재 사용 안 함

### 파일 위치
```
frontend/public/banners/
├── og-logo.jpg    ← 여기에 교체
├── og-logo.png    ← 여기에 교체 (선택)
└── og-logo.webp   ← 여기에 교체 (선택)
```

### 권장 사양
- **크기**: 1200 x 630 픽셀 (OG 표준)
- **형식**: JPG (가장 많이 사용)
- **용량**: 가능하면 200KB 이하
- **내용**: 
  - 로고 중앙 배치
  - 배경색 또는 배경 이미지
  - "덕스타" 브랜딩 포함

---

## 🔧 교체 후 확인 사항

1. **파일 크기 확인**
   ```bash
   ls -lh frontend/public/banners/og-logo.jpg
   ```

2. **이미지 크기 확인**
   ```bash
   file frontend/public/banners/og-logo.jpg
   # 1200x630인지 확인
   ```

3. **카카오톡 개발자 도구에서 테스트**
   - https://developers.kakao.com/tool/clear/og
   - URL: `https://duckstar.kr`
   - 이미지가 제대로 표시되는지 확인

4. **배포 후 확인**
   - 배포 후 실제 URL에서 이미지 접근 가능한지 확인
   - `https://duckstar.kr/banners/og-logo.jpg`

---

## 📌 참고사항

- 현재 `og-logo.jpg`는 88x80 로고를 1200x630으로 확대한 버전
- OG 이미지로는 로고 + 배경이 포함된 전용 이미지 권장
- 모든 페이지에서 동일한 OG 이미지 사용 (애니메이션 상세 제외)

