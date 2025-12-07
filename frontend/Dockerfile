# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 의존성 먼저
COPY package*.json ./
RUN npm ci --ignore-scripts

# 소스 복사
COPY . .

# env 파일
RUN echo "NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL" > .env.production

# 빌드 (standalone 출력 생성)
RUN NODE_OPTIONS="--max-old-space-size=1536" npm run build

# Stage 2: Run (standalone)
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 보안용 유저
RUN addgroup --system nodejs && \
    adduser --system nextjs

# 필요한 것만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
