#!/bin/bash

# 배포 전 체크 스크립트
# 사용법: ./check-deployment.sh

set -e

echo "🚀 배포 전 체크 시작..."
echo ""

# 1. .next/standalone 폴더 확인
echo "1️⃣  .next/standalone 폴더 생성 확인 중..."
if [ -d ".next/standalone" ]; then
    echo "   ✅ .next/standalone 폴더가 존재합니다."
else
    echo "   ❌ .next/standalone 폴더가 없습니다!"
    echo "   💡 'npm run build'를 먼저 실행하세요."
    exit 1
fi

# 2. .next/standalone/server.js 파일 확인
echo ""
echo "2️⃣  .next/standalone/server.js 파일 확인 중..."
# Next.js standalone 모드는 빌드 시 WORKDIR 경로를 유지함
# 로컬 빌드: .next/standalone/Projects/duckstar/frontend/server.js
# Docker 빌드: .next/standalone/app/server.js
SERVER_JS_PATH=$(find .next/standalone -name "server.js" -type f 2>/dev/null | head -1)

if [ -n "$SERVER_JS_PATH" ]; then
    echo "   ✅ server.js 파일을 찾았습니다: $SERVER_JS_PATH"
    echo "   📄 파일 크기: $(du -h "$SERVER_JS_PATH" | cut -f1)"
    echo ""
    echo "   ⚠️  참고: Docker 빌드 시에는 .next/standalone/app/server.js 경로가 생성됩니다."
    echo "   💡 Dockerfile의 CMD는 'node app/server.js'를 사용합니다."
else
    echo "   ❌ server.js 파일을 찾을 수 없습니다!"
    echo "   💡 next.config.ts에 'output: \"standalone\"'이 설정되어 있는지 확인하세요."
    echo "   💡 'npm run build'를 다시 실행해보세요."
    exit 1
fi

# 3. puppeteer 사용 여부 확인
echo ""
echo "3️⃣  puppeteer 패키지 사용 여부 확인 중..."
PUPPETEER_USAGE=$(grep -r "puppeteer" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "node_modules" | wc -l | tr -d ' ')

if [ "$PUPPETEER_USAGE" -eq "0" ]; then
    echo "   ✅ puppeteer를 사용하는 코드가 없습니다."
    echo "   💡 package.json에서 puppeteer를 제거할 수 있습니다."
    echo ""
    echo "   제거 명령어:"
    echo "   npm uninstall puppeteer"
else
    echo "   ⚠️  puppeteer를 사용하는 코드가 $PUPPETEER_USAGE개 발견되었습니다."
    echo "   📋 사용 위치:"
    grep -r "puppeteer" src/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v "node_modules" || true
fi

echo ""
echo "✅ 모든 체크 완료!"
echo ""
echo "📋 다음 단계:"
echo "   1. puppeteer가 사용되지 않는다면 제거: npm uninstall puppeteer"
echo "   2. Docker 빌드 테스트: docker build -t duckstar-frontend ."
echo "   3. Docker 실행 테스트: docker run -p 3000:3000 duckstar-frontend"

