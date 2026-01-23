#!/bin/bash
set -e

echo "🔨 Backend 빌드 중..."
cd backend
./gradlew clean build -x test
cd ..

echo "🐳 Docker Compose 실행 중..."
docker-compose -f docker-compose.local.yml up --build