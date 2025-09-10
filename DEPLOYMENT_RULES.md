# 🚀 Duckstar 배포 규칙 (Deployment Rules)

> 오늘 배포에서 발생한 문제들을 바탕으로 작성된 규칙입니다.

## 📋 필수 체크리스트

### 1. 이미지 컴포넌트 검증
- [ ] **SVG 이미지**: 반드시 `<img>` 태그 사용 (Next.js Image 컴포넌트 사용 금지)
- [ ] **WebP 이미지**: 반드시 `<img>` 태그 사용 (외부 WebP 이미지 400 에러 방지)
- [ ] **기타 이미지**: Next.js Image 컴포넌트 사용 가능

### 2. API 응답 구조 검증
- [ ] **Swagger 문서 확인**: API 응답 구조를 먼저 확인
- [ ] **필드명 검증**: 예상 필드명과 실제 API 응답 필드명 일치 확인
- [ ] **타입 안정성**: TypeScript 인터페이스와 실제 API 응답 구조 일치

### 3. 환경 변수 설정
- [ ] **로컬 환경**: `.env.local` 파일 설정
- [ ] **프로덕션 환경**: GitHub Secrets 설정
- [ ] **Docker 환경**: `docker-compose.yml`에서 환경 변수 전달
- [ ] **Fallback URL**: 프로덕션 URL로 설정

### 4. 파일 구조 검증
- [ ] **README.md**: HTML 구조 검증 (중복 태그, 닫히지 않은 태그)
- [ ] **이미지 경로**: 실제 존재하는 파일 경로 사용
- [ ] **스크린샷**: 존재하는 이미지 파일만 참조

## 🔍 체계적 검색 명령어

### SVG Image 컴포넌트 검색
```bash
grep -r "Image.*src.*\.svg" frontend/src/
grep -r "<Image.*\.svg" frontend/src/
```

### WebP Image 컴포넌트 검색
```bash
grep -r "Image.*src.*\.webp" frontend/src/
grep -r "Image.*src.*img\.duckstar\.kr" frontend/src/
```

### 전체 Image 컴포넌트 검색
```bash
grep -r "from.*next/image" frontend/src/components/
```

## 🚨 주의사항

### Next.js Image 컴포넌트 문제
- **SVG 파일**: 400 Bad Request 에러 발생
- **외부 WebP 이미지**: 400 Bad Request 에러 발생
- **해결책**: 문제가 되는 이미지 형식만 `<img>` 태그로 변경

### API 응답 구조
- **캐릭터 데이터**: `imageUrl` → `mainThumbnailUrl`, `voiceActor` → `cv`
- **스웨거 문서**: 반드시 확인 후 필드명 사용
- **추측 금지**: API 응답 구조를 임의로 추측하지 말 것

### 배포 전 검증
- **부분적 검색 금지**: 전체 프로젝트 범위에서 검색
- **"완료됐다" 단정 금지**: 체계적 검증 후에만 완료 선언
- **근본 원인 파악**: 임시방편보다는 근본적 해결책 선택

## 📁 수정된 컴포넌트 목록

### SVG Image → img 태그 변경
- ✅ `Header.tsx` - logo.svg, header-search.svg
- ✅ `Sidebar.tsx` - 모든 네비게이션 아이콘들
- ✅ `RightCommentPanel.tsx` - post-episodeComment.svg
- ✅ `EpisodeSection.tsx` - episodes-before.svg, episodes-after.svg
- ✅ `SearchFilters.tsx` - searchSection-notify-icon.svg, 모든 OTT 로고들
- ✅ `AnimeSearchBar.tsx` - mail-chat-bubble.svg, search-icon.svg, OTT 로고들
- ✅ `VoteBanner.tsx` - star-1.svg, star-2.svg
- ✅ `VoteToggle.tsx` - voted-bonus.svg, voted-normal.svg, 모든 호버 효과 SVG들
- ✅ `VoteButton.tsx` - button-block.svg
- ✅ `VoteStamp.tsx` - voteSection-bonus-stamp.svg, voteSection-infinity.svg
- ✅ `CommentHeader.tsx` - comment-header-icon.svg, delete-filter.svg
- ✅ `TooltipPortal.tsx` - voteSection-notify-hide.svg
- ✅ `GenderSelection.tsx` - voteSection-selected.svg, voteSection-default.svg

### WebP Image → img 태그 변경
- ✅ `VoteCard.tsx` - 썸네일 이미지 (데스크톱/모바일)
- ✅ `AnimeCard.tsx` - 애니메이션 썸네일 이미지
- ✅ `VoteBanner.tsx` - Duckstar 로고 이미지

## 🎯 성능 최적화 유지

- **`unoptimized: false`** 설정 유지
- **WebP 최적화** 활성화
- **문제가 되는 이미지 형식만** `<img>` 태그로 처리
- **기타 이미지**는 Next.js Image 컴포넌트 사용

## 📝 커밋 메시지 템플릿

```
fix: SVG/WebP 이미지 컴포넌트를 img 태그로 변경하여 400 에러 해결

- 모든 SVG 파일에 대해 Next.js Image 컴포넌트를 img 태그로 변경
- 외부 WebP 이미지에 대해 Next.js Image 컴포넌트를 img 태그로 변경
- 캐릭터 데이터 매핑을 API 응답 구조에 맞춰 수정
- README.md HTML 구조 문제 수정
- WebP 최적화는 유지하면서 특정 이미지 형식의 에러만 방지
```

---

**마지막 업데이트**: 2025년 1월 25일  
**작성자**: AI Assistant  
**배포 문제 해결**: SVG 400 에러, WebP 400 에러, API 응답 구조 불일치, README HTML 구조 문제
