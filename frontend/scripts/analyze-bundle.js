#!/usr/bin/env node

/**
 * 번들 분석 스크립트
 * 번들 크기와 의존성을 분석하여 최적화 포인트 찾기
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 번들 분석 시작...\n');

try {
  // Next.js 번들 분석 실행
  console.log('📊 Next.js 번들 분석 중...');
  execSync('npx @next/bundle-analyzer', { stdio: 'inherit' });
  
  console.log('\n✅ 번들 분석 완료!');
  console.log('\n📋 최적화 권장사항:');
  console.log('1. 큰 라이브러리들을 동적 임포트로 변경');
  console.log('2. 사용하지 않는 의존성 제거');
  console.log('3. 이미지 최적화 및 압축');
  console.log('4. 폰트 최적화 (Pretendard만 사용)');
  console.log('5. CSS 최적화 및 중복 제거');
  
} catch (error) {
  console.error('❌ 번들 분석 실패:', error.message);
  process.exit(1);
}
