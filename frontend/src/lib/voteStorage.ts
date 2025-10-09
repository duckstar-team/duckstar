/**
 * 사용자 투표 이력을 브라우저에 저장/관리하는 유틸리티
 * 백엔드 ensureVoteCookie와 동일한 TTL 로직 적용
 */

const VOTED_EPISODES_KEY = 'duckstar_voted_episodes';
const VOTED_EPISODES_TTL_KEY = 'duckstar_voted_episodes_ttl';

/**
 * 다음 월요일 18시까지의 TTL을 계산합니다 (백엔드와 동일한 로직)
 */
function getNextWeekEndTTL(): number {
  const now = new Date();
  
  // 다음 월요일 18시 계산
  const nextMonday = new Date(now);
  const dayOfWeek = now.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
  const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7; // 월요일까지 남은 일수
  
  nextMonday.setDate(now.getDate() + daysToMonday);
  nextMonday.setHours(18, 0, 0, 0); // 오후 6시
  
  // 이미 월요일 18시를 지났다면 → 다음 주 월요일 18시
  if (now >= nextMonday) {
    nextMonday.setDate(nextMonday.getDate() + 7);
  }
  
  // TTL 계산 (밀리초)
  return nextMonday.getTime() - now.getTime();
}

/**
 * TTL이 만료되었는지 확인합니다
 */
function isTTLExpired(): boolean {
  try {
    const storedTTL = localStorage.getItem(VOTED_EPISODES_TTL_KEY);
    if (!storedTTL) return true;
    
    const ttlTimestamp = parseInt(storedTTL);
    return Date.now() > ttlTimestamp;
  } catch (error) {
    console.error('TTL 확인 실패:', error);
    return true;
  }
}

/**
 * TTL을 설정합니다
 */
function setTTL(): void {
  try {
    const ttl = getNextWeekEndTTL();
    const expiryTime = Date.now() + ttl;
    localStorage.setItem(VOTED_EPISODES_TTL_KEY, expiryTime.toString());
    console.log('TTL 설정됨:', new Date(expiryTime).toLocaleString());
  } catch (error) {
    console.error('TTL 설정 실패:', error);
  }
}

/**
 * 투표한 episode ID 목록을 가져옵니다 (TTL 확인 포함)
 */
export function getVotedEpisodes(): number[] {
  try {
    // TTL이 만료되었으면 데이터 삭제
    if (isTTLExpired()) {
      clearVotedEpisodes();
      return [];
    }
    
    const stored = localStorage.getItem(VOTED_EPISODES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('투표 이력 불러오기 실패:', error);
    return [];
  }
}

/**
 * episode ID를 투표 목록에 추가합니다 (TTL 설정 포함)
 */
export function addVotedEpisode(episodeId: number): void {
  try {
    const currentVotes = getVotedEpisodes();
    if (!currentVotes.includes(episodeId)) {
      const updatedVotes = [...currentVotes, episodeId];
      localStorage.setItem(VOTED_EPISODES_KEY, JSON.stringify(updatedVotes));
      
      // TTL 설정 (첫 번째 투표 시 또는 TTL이 만료된 경우)
      if (currentVotes.length === 0 || isTTLExpired()) {
        setTTL();
      }
      
      console.log('투표 저장됨:', updatedVotes);
    }
  } catch (error) {
    console.error('투표 저장 실패:', error);
  }
}

/**
 * 특정 episode ID가 투표되었는지 확인합니다
 */
export function hasVotedEpisode(episodeId: number): boolean {
  const votedEpisodes = getVotedEpisodes();
  return votedEpisodes.includes(episodeId);
}

/**
 * 투표 이력을 모두 삭제합니다 (TTL 포함)
 */
export function clearVotedEpisodes(): void {
  try {
    localStorage.removeItem(VOTED_EPISODES_KEY);
    localStorage.removeItem(VOTED_EPISODES_TTL_KEY);
    console.log('투표 이력 삭제됨');
  } catch (error) {
    console.error('투표 이력 삭제 실패:', error);
  }
}

/**
 * 현재 저장된 투표 개수를 반환합니다
 */
export function getVotedCount(): number {
  return getVotedEpisodes().length;
}

/**
 * TTL 만료 시간을 반환합니다 (개발/디버깅용)
 */
export function getTTLExpiryTime(): Date | null {
  try {
    const storedTTL = localStorage.getItem(VOTED_EPISODES_TTL_KEY);
    if (!storedTTL) return null;
    
    const ttlTimestamp = parseInt(storedTTL);
    return new Date(ttlTimestamp);
  } catch (error) {
    console.error('TTL 만료 시간 확인 실패:', error);
    return null;
  }
}

/**
 * TTL이 만료되었는지 확인합니다 (외부에서 사용 가능)
 */
export function isVoteDataExpired(): boolean {
  return isTTLExpired();
}
