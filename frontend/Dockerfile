# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy source code
COPY . .

# Export static files
RUN npm run build && npm run export

# Final stage: serve static files from nginx
FROM nginx:stable-alpine
COPY --from=builder /app/out /usr/share/nginx/html
