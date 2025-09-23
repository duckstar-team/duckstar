// 검색 유틸리티 함수들


// 한글 초성 추출 함수
export function extractChosung(text: string): string {
  let result = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    // 한글 유니코드 범위: 44032(가) ~ 55203(힣)
    if (code >= 44032 && code <= 55203) {
      // 한글 초성 계산: (유니코드 - 44032) / 28 / 21
      const chosungIndex = Math.floor((code - 44032) / 28 / 21);
      const chosungList = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
      result += chosungList[chosungIndex];
    } else if (char === ' ') {
      // 공백은 건너뛰기
      continue;
    } else {
      // 공백이 아닌 다른 문자는 그대로 유지
      result += char;
    }
  }
  
  return result;
}

// 띄어쓰기를 제거한 텍스트 생성
export function removeSpaces(text: string): string {
  return text.replace(/\s+/g, '');
}

// HTML 엔티티 디코딩 함수
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

// 검색 매칭 함수 (초성 전용 또는 BlankIgnored 키워드 검색)
export function searchMatch(searchQuery: string, targetText: string): boolean {
  if (!searchQuery.trim()) return true;
  
  // HTML 엔티티 디코딩
  const decodedQuery = decodeHtmlEntities(searchQuery.trim().toLowerCase());
  const decodedTarget = decodeHtmlEntities(targetText.toLowerCase());
  
  // 1. 초성만 입력한 경우인지 확인 (한글 자음과 띄어쓰기만 있는지)
  const isChosungOnly = /^[ㄱ-ㅎ\s]+$/.test(decodedQuery);
  
  if (isChosungOnly) {
    // 초성 검색: BlankIgnored 방식으로 띄어쓰기 무시하고 검색
    const targetChosung = extractChosung(decodedTarget);
    const queryChosung = removeSpaces(decodedQuery); // 띄어쓰기 제거
    
    return targetChosung.includes(queryChosung);
  } else {
    // 일반 키워드 검색: BlankIgnored 방식
    // 1-1. 원본 텍스트에서 검색 (띄어쓰기 포함)
    if (decodedTarget.includes(decodedQuery)) {
      return true;
    }
    
    // 1-2. 띄어쓰기 무시하고 검색
    const targetNoSpace = removeSpaces(decodedTarget);
    const queryNoSpace = removeSpaces(decodedQuery);
    
    if (targetNoSpace.includes(queryNoSpace)) {
      return true;
    }
    
    return false;
  }
}

