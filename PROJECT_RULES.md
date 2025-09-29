# 🦆 Duckstar 프로젝트 규칙 세트 (Project Rules)

> Duckstar 애니메이션 투표 플랫폼 개발을 위한 종합 규칙 가이드

## 📋 프로젝트 개요

**Duckstar**는 분기 신작 애니메이션 팬들을 위한 주차별 투표와 차트 제공 플랫폼입니다.

### 🎯 주요 기능
- **실시간 투표 시스템**: 주차별 애니메이션 투표 ✅
- **차트 시스템**: 주차별 애니메이션/캐릭터 순위 차트 ✅
- **애니메이션 홈**: 애니메이션별 정보, 분기별 성적, 등장인물 ✅
- **커뮤니티 기능**: 애니메이션별 댓글 및 답글 시스템 ✅
- **검색 기능**: 애니메이션 및 캐릭터 검색, 분기별 편성 정보 ✅
- **OAuth 인증**: 카카오 로그인 연동 ✅

## 🏗️ 아키텍처 규칙

### 기술 스택
```
Frontend: Next.js 15.5.0 + TypeScript 5.0 + Tailwind CSS 4.1
Backend: Spring Boot 3.5.4 + Java 17 + QueryDSL + JPA
Database: MySQL 8.0 + H2 (테스트)
Infrastructure: Docker + Nginx + EC2 + Vercel
```

### 프로젝트 구조
```
duckstar/
├── frontend/                 # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/              # App Router 페이지
│   │   ├── components/       # 재사용 가능한 컴포넌트
│   │   ├── api/              # API 클라이언트
│   │   ├── hooks/            # 커스텀 훅
│   │   ├── utils/            # 유틸리티 함수
│   │   └── types/            # TypeScript 타입 정의
│   └── public/               # 정적 파일
├── backend/                  # Spring Boot 백엔드
│   └── src/main/java/com/duckstar/
│       ├── domain/           # 도메인 모델
│       ├── web/              # 웹 계층 (Controller, DTO)
│       ├── service/          # 비즈니스 로직
│       ├── repository/       # 데이터 접근 계층
│       ├── security/         # 보안 및 인증
│       └── apiPayload/       # API 응답 표준화
└── nginx/                    # Nginx 설정
```

## 🎨 프론트엔드 개발 규칙

### 1. 컴포넌트 개발 규칙
- **함수형 컴포넌트** 사용 (React Hooks 기반)
- **TypeScript** 필수 사용, `any` 타입 금지
- **재사용 가능한 컴포넌트** 설계
- **Props 인터페이스** 명시적 정의

### 2. 스타일링 규칙
- **Tailwind CSS** 우선 사용
- **커스텀 CSS** 최소화
- **반응형 디자인** 필수 (xs: 280px, sm: 400px, md: 768px, lg: 1024px, xl: 1280px)
- **Pretendard 폰트** 사용

### 3. 이미지 처리 규칙
- **SVG 파일**: 반드시 `<img>` 태그 사용 (Next.js Image 컴포넌트 금지)
- **WebP 파일**: 반드시 `<img>` 태그 사용 (외부 WebP 이미지 400 에러 방지)
- **기타 이미지**: Next.js Image 컴포넌트 사용 가능
- **이미지 최적화**: WebP 변환 및 압축 적용

### 4. 상태 관리 규칙
- **SWR** 사용 (데이터 페칭)
- **React Context** 사용 (전역 상태)
- **로컬 상태**: useState, useReducer 사용
- **서버 상태**: SWR 캐싱 활용

### 5. 라우팅 규칙
- **App Router** 사용 (Next.js 13+)
- **동적 라우팅**: `[id]` 형태 사용
- **중첩 라우팅**: `layout.tsx` 활용
- **스크롤 복원**: 페이지 전환 시 스크롤 위치 관리

## 🔧 백엔드 개발 규칙

### 1. 아키텍처 패턴
- **계층형 아키텍처** (Controller → Service → Repository)
- **도메인 중심 설계** (DDD)
- **의존성 주입** (Spring IoC)
- **인터페이스 기반 설계**

### 2. API 설계 규칙
- **RESTful API** 설계 원칙 준수
- **HTTP 상태 코드** 적절한 사용
- **API 응답 표준화** (ApiPayload 패턴)
- **Swagger 문서화** 필수

### 3. 데이터베이스 규칙
- **JPA** 사용 (Spring Data JPA)
- **QueryDSL** 사용 (복잡한 쿼리)
- **트랜잭션 관리** 적절한 사용
- **연관관계 매핑** 최적화

### 4. 보안 규칙
- **Spring Security** 사용
- **JWT 토큰** 기반 인증
- **OAuth 2.0** (카카오 로그인)
- **CORS 설정** 적절한 구성

## 🚀 배포 규칙

### 1. 배포 전 체크리스트
- [ ] **이미지 컴포넌트 검증**: SVG/WebP는 `<img>` 태그 사용
- [ ] **API 응답 구조 검증**: Swagger 문서와 일치 확인
- [ ] **환경 변수 설정**: 로컬/프로덕션 환경 분리
- [ ] **파일 구조 검증**: README.md HTML 구조 확인

### 2. 이미지 최적화 규칙
- **CORS 설정** 확인 (img.duckstar.kr)
- **메모리 사용량** 모니터링 (30초마다 자동 정리)
- **배치 로딩** 적용
- **뷰포트 기반 지연 로딩** 구현

### 3. 성능 최적화 규칙
- **초기 로딩 시간**: 1-2초 목표
- **메모리 사용량**: 100MB 이하 유지
- **동시 이미지 요청**: 3개 이하 제한
- **WebP 최적화** 활성화

## 🧪 테스트 규칙

### 1. 프론트엔드 테스트
- **컴포넌트 테스트**: Jest + React Testing Library
- **E2E 테스트**: Playwright 사용
- **타입 체크**: TypeScript 컴파일 검증

### 2. 백엔드 테스트
- **단위 테스트**: JUnit 5
- **통합 테스트**: @SpringBootTest
- **테스트 데이터**: H2 인메모리 데이터베이스

## 📝 코딩 컨벤션

### 1. 네이밍 규칙
- **변수/함수**: camelCase
- **상수**: UPPER_SNAKE_CASE
- **컴포넌트**: PascalCase
- **파일명**: kebab-case (컴포넌트는 PascalCase)

### 2. 코드 구조
- **ESLint 규칙** 준수 (Next.js core-web-vitals)
- **Prettier** 사용 (코드 포맷팅)
- **Import 순서**: 외부 라이브러리 → 내부 모듈
- **주석**: JSDoc 스타일 사용

### 3. Git 규칙
- **커밋 메시지**: Conventional Commits
- **브랜치 전략**: Git Flow
- **PR 규칙**: 코드 리뷰 필수

## 🔍 품질 관리 규칙

### 1. 코드 품질
- **타입 안정성**: TypeScript strict 모드
- **에러 처리**: try-catch 및 에러 바운더리
- **접근성**: ARIA 속성 및 시맨틱 HTML
- **성능**: React.memo, useMemo, useCallback 활용

### 2. 보안 규칙
- **XSS 방지**: 입력값 검증 및 이스케이핑
- **CSRF 방지**: SameSite 쿠키 설정
- **SQL 인젝션 방지**: JPA 사용
- **환경 변수**: 민감한 정보 분리

## 📊 모니터링 규칙

### 1. 성능 모니터링
- **Core Web Vitals** 측정
- **이미지 로딩 시간** 추적
- **메모리 사용량** 모니터링
- **API 응답 시간** 측정

### 2. 에러 모니터링
- **클라이언트 에러**: 콘솔 로그 및 에러 바운더리
- **서버 에러**: 로그 파일 및 알림
- **네트워크 에러**: 재시도 로직 구현

## 🚨 주의사항

### 1. 금지사항
- **Next.js Image 컴포넌트**: SVG/WebP 파일에 사용 금지
- **API 응답 추측**: Swagger 문서 확인 후 구현
- **하드코딩**: 환경 변수 및 설정 파일 사용
- **메모리 누수**: 이미지 캐시 정리 로직 필수

### 2. 필수사항
- **타입 안정성**: 모든 컴포넌트와 함수에 타입 정의
- **에러 처리**: 모든 API 호출에 에러 처리
- **반응형 디자인**: 모든 컴포넌트 반응형 구현
- **접근성**: 키보드 네비게이션 및 스크린 리더 지원

## 📚 참고 문서

- [DEPLOYMENT_RULES.md](./DEPLOYMENT_RULES.md) - 배포 관련 상세 규칙
- [DEPLOYMENT_CHECKLIST_IMAGE_OPTIMIZATION.md](./DEPLOYMENT_CHECKLIST_IMAGE_OPTIMIZATION.md) - 이미지 최적화 체크리스트
- [README.md](./README.md) - 프로젝트 개요 및 기술 스택

---

**마지막 업데이트**: 2025년 1월 25일  
**작성자**: AI Assistant  
**프로젝트**: Duckstar 애니메이션 투표 플랫폼
