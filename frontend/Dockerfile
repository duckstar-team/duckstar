# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 의존성 파일만 먼저 복사하여 빌드 캐시 최적화
COPY package*.json ./

# 모든 의존성 설치 (빌드에 devDependencies도 필요)
# --ignore-scripts로 puppeteer의 Chrome 다운로드 방지 (CPU 절약)
RUN npm ci --ignore-scripts

# 소스 코드 복사
COPY . .

# 환경 변수 파일 생성
RUN echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" > .env.production

# 빌드 실행
# 메모리 제한 설정 (t3.small에 적합한 수준)
# standalone 모드가 활성화되어 있으므로 .next/standalone이 생성됨
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build

# Stage 2: Run (standalone 모드)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 시스템 사용자 생성 (보안 강화)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone 출력에서 필요한 파일만 복사
# next.config.ts에 output: 'standalone'이 설정되어 있으므로
# .next/standalone 폴더가 생성됨
# Next.js standalone 모드는 빌드 시 WORKDIR 경로를 유지하므로
# .next/standalone/app/server.js가 생성됨
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone 모드에서는 server.js를 직접 실행
# Docker 빌드 시 WORKDIR이 /app이므로 .next/standalone/app/server.js가 생성됨
# 하지만 standalone 폴더를 루트로 복사했으므로 ./app/server.js로 접근
CMD ["node", "app/server.js"]
