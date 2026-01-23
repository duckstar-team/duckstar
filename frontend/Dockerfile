# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

# 빌드 시점에 주입받을 변수 선언
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KAKAO_APP_KEY
ARG BACKEND_URL

# Next.js 빌드 프로세스에 변수 노출
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_KAKAO_APP_KEY=$NEXT_PUBLIC_KAKAO_APP_KEY
ENV BACKEND_URL=$BACKEND_URL

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# 환경변수 파일 생성
RUN echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" > .env.production && \
    echo "NEXT_PUBLIC_KAKAO_APP_KEY=$NEXT_PUBLIC_KAKAO_APP_KEY" >> .env.production

# Next.js Standalone 빌드 수행
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build


# Stage 2: Run
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system nodejs && adduser --system nextjs

# Standalone 실행에 필요한 최소 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Standalone 모드는 server.js를 직접 실행함
CMD ["node", "server.js"]