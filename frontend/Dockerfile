# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_KAKAO_APP_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_KAKAO_APP_KEY=$NEXT_PUBLIC_KAKAO_APP_KEY

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

RUN echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" > .env.production && \
    echo "NEXT_PUBLIC_KAKAO_APP_KEY=$NEXT_PUBLIC_KAKAO_APP_KEY" >> .env.production

# Next.js standalone build
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build


# Stage 2: Run
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system nodejs && adduser --system nextjs

# pm2 설치
RUN npm install -g pm2

# 정적 파일
COPY --from=builder /app/public ./public

# Next.js standalone 구조 전체 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

USER nextjs

EXPOSE 3000

# PM2 클러스터 모드로 server.js 실행
CMD ["pm2-runtime", "server.js", "-i", "max"]

# # standalone 빌드 출력 기준 경로에서 server.js 실행
# CMD ["node", "server.js"]