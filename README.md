# DUCKSTAR - 애니메이션 투표 플랫폼
<p align="center">
  <img src="screenshots/logo.svg" alt="DuckStar Logo" width="200"/>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Next.js-15.5.7-black?style=for-the-badge&logo=next.js"/>
    <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript"/>
    <img src="https://img.shields.io/badge/Spring%20Boot-3.5.4-6DB33F?style=for-the-badge&logo=spring-boot"/>
    <img src="https://img.shields.io/badge/Java-17-red?style=for-the-badge&logo=java"/>
</p>

<p align="center">
    <img src="https://img.shields.io/badge/Docker-28.3.3-2496ED?style=for-the-badge&logo=docker"/>
    <img src="https://img.shields.io/badge/Nginx-1.28.1-009639?style=for-the-badge&logo=nginx&logoColor=white"/>
    <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql"/>
</p>



**1. 전체 구조**

```
[개발자 Push/PR] → [GitHub Actions] → (빌드·테스트·배포)
                                           ↓
                                 [EC2 Docker Compose]
                                           ↓
  [클라이언트]   →   [Nginx]    →   [Frontend / Backend]  ←→  [S3]
                [:80 / :443]       [:3000 / :8080]      
                                           ↓
                                      [MySQL RDS]
```

- **인프라**: Docker Compose + Nginx + EC2 (백엔드·프론트엔드 모두 EC2에서 Docker Compose로 운영)
- **프론트**: Next.js (SSR/클라이언트)
- **백엔드**: Spring Boot API
- **DB**: MySQL 8.0 (운영), H2 (테스트)

---

**2. 요청 흐름 (Nginx 라우팅)**

nginx/default.conf 기준:

| 경로 | 대상 | 용도 |
| --- | --- | --- |
| /api/image-proxy | Frontend:3000 | Next.js API (이미지 프록시 등) |
| /api | Backend:8080 | REST API |
| /oauth2 | Backend:8080 | OAuth2(카카오) |
| /login | Backend:8080 | 로그인 |
| / | Frontend:3000 | 페이지/정적 리소스 |

HTTPS(443) + HTTP→HTTPS 리다이렉트(80→301) 구성

---

**3. 백엔드 (Spring Boot) – 계층형 + 도메인 중심**

- **web/** – Controller, DTO (요청/응답)
- **service/** – 비즈니스 로직 (Command/Query 분리, 예: AnimeCommandService, AnimeQueryService)
- **repository/** – JPA + QueryDSL
- **domain/** – 엔티티, enum, 매핑/연관관계, VO
- **security/** – JWT, OAuth2(카카오), 필터/프로바이더
- **apiPayload/** – 공통 API 응답 형식, ExceptionAdvice + 도메인별 Handler
- **config/** – Swagger, QueryDSL, S3, Hasher 등
- **validation/** – 커스텀 검증 애노테이션/Validator
- **abroad/** – 해외 관련 csv 업로드 로직
- **schedule/** – 스케줄/초기화
- **s3/** – S3 업로드

**특징:** Controller → Service → Repository 계층 + 도메인 중심 설계, RESTful API, JWT + OAuth2, ApiPayload로 응답/에러 표준화.

---

**4. 프론트엔드 (Next.js) – App Router + 기능별 모듈**

**디렉터리 구조:**

- **app/** – App Router 페이지/레이아웃
- **components/** – 공통(common/), 도메인별(anime/, chart/, comment/, search/, vote/ 등), 레이아웃, SEO, 스켈레톤
- **api/** – 백엔드 API 클라이언트 (auth, chart, comment, home, member, search, vote, admin 등)
- **hooks/** – 댓글, 이미지 캐시/프리로드, 네비게이션, 화면 크기 등
- **context/** – AuthContext 등 전역 상태
- **lib/** – SWR 설정, 상수, 이미지/쿠키/스토리지 유틸
- **types/** – DTO/enum (백엔드와 맞춤)
- **providers/** – React Query, 테마 등
- **middleware.ts** – 라우트/인증 등 미들웨어

**기술:** Next.js 15, TypeScript, Tailwind CSS, SWR(데이터 페칭), Framer Motion. SVG/WebP는 `<img>` 사용 등 이미지 규칙 있음.

---

**5. 데이터 흐름**

1. 브라우저 → Nginx(HTTPS)
2. Nginx가 경로에 따라 Frontend(Next.js) 또는 Backend(Spring Boot)로 프록시
3. 프론트 `api/*`가 백엔드 `/api`, `/oauth2`, `/login` 호출
4. 백엔드는 JPA/QueryDSL로 MySQL 접근, JWT/OAuth2로 인증
5. 응답은 ApiPayload 형식으로 통일, 프론트는 types/와 SWR로 처리

---

**6. 배포/운영**

- **프로덕션**: EC2 한 서버에서 **Docker Compose**로 **백엔드·프론트엔드·Nginx** 모두 실행 (풀스택 EC2 배포).
- **로컬/스테이징**: 동일한 docker-compose.yml로 backend, frontend, nginx를 한 네트워크에서 실행.
- **CI/CD**: .github/workflows/ – ci.yml, deploy-backend.yml, deploy-frontend.yml.
---

<div align="center">
  <p>Made by Duckstar Team</p>
  <p>© 2025 Duckstar. All rights reserved.</p>
</div>
