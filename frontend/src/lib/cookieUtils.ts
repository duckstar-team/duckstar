// 투표 진행 상황을 저장하는 쿠키 유틸리티

export interface VoteProgressState {
  selected: number[];
  bonusSelected: number[];
  isBonusMode: boolean;
  hasClickedBonus: boolean;
  searchQuery: string;
  showGenderSelection: boolean;
  selectedGender: 'male' | 'female' | null;
  timestamp: number;
}

const VOTE_PROGRESS_COOKIE_NAME = 'vote_progress';
const COOKIE_EXPIRY_DAYS = 7; // 7일간 유지



// 쿠키 설정 함수
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// 쿠키 읽기 함수
function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

// 쿠키 삭제 함수
function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// 이전 저장된 상태를 캐시하여 불필요한 저장 방지
let lastSavedState: string | null = null;

// 투표 진행 상황 저장
export function saveVoteProgress(state: Omit<VoteProgressState, 'timestamp'>) {
  // 브라우저 환경에서만 실행
  if (typeof window === 'undefined') return;
  
  const voteProgress: VoteProgressState = {
    ...state,
    timestamp: Date.now()
  };
  
  try {
    const serialized = JSON.stringify(voteProgress);
    
    // 이전 상태와 동일하면 저장하지 않음
    if (lastSavedState === serialized) {
      return;
    }
    

    
    setCookie(VOTE_PROGRESS_COOKIE_NAME, serialized, COOKIE_EXPIRY_DAYS);
    lastSavedState = serialized;
  } catch (error) {
  }
}

// 투표 진행 상황 복원
export function loadVoteProgress(): VoteProgressState | null {
  // 브라우저 환경에서만 실행
  if (typeof window === 'undefined') return null;
  
  try {
    const cookieValue = getCookie(VOTE_PROGRESS_COOKIE_NAME);
    if (!cookieValue) return null;
    
    const voteProgress: VoteProgressState = JSON.parse(cookieValue);
    
    // 쿠키가 만료되었는지 확인 (7일)
    const now = Date.now();
    const cookieAge = now - voteProgress.timestamp;
    const maxAge = COOKIE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    
    if (cookieAge > maxAge) {
      deleteVoteProgress();
      return null;
    }
    
    return voteProgress;
  } catch (error) {
    deleteVoteProgress();
    return null;
  }
}

// 투표 진행 상황 삭제
export function deleteVoteProgress() {
  // 브라우저 환경에서만 실행
  if (typeof window === 'undefined') return;
  
  deleteCookie(VOTE_PROGRESS_COOKIE_NAME);
  lastSavedState = null; // 캐시도 초기화
}

// 투표 완료 시 진행 상황 삭제
export function clearVoteProgressOnComplete() {
  deleteVoteProgress();
}

// vote_cookie_id 쿠키 확인
export function hasVoteCookieId(): boolean {
  if (typeof window === 'undefined') return false;
  
  const voteCookieId = getCookie('vote_cookie_id');
  return voteCookieId !== null && voteCookieId !== '';
}

// voted_this_week 쿠키 확인
export function hasVotedThisWeek(): boolean {
  if (typeof window === 'undefined') return false;
  const votedThisWeek = getCookie('voted_this_week');
  return votedThisWeek === '1';
}

// LOGIN_STATE 쿠키 읽기
export function getLoginState(): { isNewUser: boolean; isMigrated: boolean } | null {
  if (typeof window === 'undefined') return null;
  
  const loginState = getCookie('LOGIN_STATE');
  if (!loginState) return null;
  
  try {
    // Base64 디코딩
    const decoded = atob(loginState);
    const parsed = JSON.parse(decoded);
    return {
      isNewUser: parsed.isNewUser === true,
      isMigrated: parsed.isMigrated === true
    };
  } catch (error) {
    console.error('LOGIN_STATE 파싱 오류:', error);
    return null;
  }
}

// LOGIN_STATE 쿠키 삭제
export function clearLoginState(): void {
  if (typeof window === 'undefined') return;
  deleteCookie('LOGIN_STATE');
}
