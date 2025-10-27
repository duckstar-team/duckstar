/**
 * 사용자 투표 이력을 브라우저에 저장/관리하는 유틸리티
 * 각 에피소드별로 개별 TTL 관리 (로그인 유도 버튼 표시용)
 */

const VOTED_EPISODES_TTL_KEY = 'duckstar_vote_ttl_map';

/**
 * 에피소드별 TTL 맵을 가져옵니다
 */
function getVotedEpisodesTTL(): Record<string, number> {
  try {
    const stored = localStorage.getItem(VOTED_EPISODES_TTL_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('TTL 맵 불러오기 실패:', error);
    return {};
  }
}

/**
 * 에피소드별 TTL 맵을 저장합니다
 */
function setVotedEpisodesTTL(ttlMap: Record<string, number>): void {
  try {
    localStorage.setItem(VOTED_EPISODES_TTL_KEY, JSON.stringify(ttlMap));
  } catch (error) {
    console.error('TTL 맵 저장 실패:', error);
  }
}

/**
 * 투표한 episode ID 목록을 가져옵니다 (TTL 확인 포함)
 */
export function getVotedEpisodes(): number[] {
  try {
    // TTL 맵에서 유효한 에피소드 ID들만 추출
    cleanupExpiredEpisodes();
    const ttlMap = getVotedEpisodesTTL();
    
    return Object.keys(ttlMap).map(id => parseInt(id));
  } catch (error) {
    console.error('투표 이력 불러오기 실패:', error);
    return [];
  }
}

/**
 * episode ID를 투표 목록에 추가합니다 (TTL 설정 포함)
 */
export function addVotedEpisodeWithTTL(episodeId: number, voteTimeLeft: number): void {
  try {
    // TTL 맵에 에피소드별 투표 남은 시간 저장
    const ttlMap = getVotedEpisodesTTL();
    ttlMap[episodeId.toString()] = voteTimeLeft;
    setVotedEpisodesTTL(ttlMap);
    
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
 * 특정 episode ID를 투표 목록에서 제거합니다 (별점 회수 시)
 */
export function removeVotedEpisode(episodeId: number): void {
  try {
    // TTL 맵에서 제거
    const ttlMap = getVotedEpisodesTTL();
    delete ttlMap[episodeId.toString()];
    setVotedEpisodesTTL(ttlMap);
    
  } catch (error) {
    console.error('투표 제거 실패:', error);
  }
}

/**
 * TTL이 만료된 에피소드들을 정리합니다
 */
export function cleanupExpiredEpisodes(): void {
  try {
    const ttlMap = getVotedEpisodesTTL();
    const now = Date.now();
    const validTTLMap: Record<string, number> = {};
    
    Object.entries(ttlMap).forEach(([episodeIdStr, voteTimeLeft]) => {
      const expiryTime = Date.now() + (voteTimeLeft * 1000);
      
      if (expiryTime > now) {
        // 아직 유효한 에피소드
        validTTLMap[episodeIdStr] = voteTimeLeft;
      }
    });
    
    // 유효한 데이터만 저장
    setVotedEpisodesTTL(validTTLMap);
    
  } catch (error) {
    console.error('만료된 에피소드 정리 실패:', error);
  }
}

/**
 * 투표 이력을 모두 삭제합니다 (TTL 포함)
 */
export function clearVotedEpisodes(): void {
  try {
    localStorage.removeItem(VOTED_EPISODES_TTL_KEY);
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
 * 특정 에피소드의 투표 남은 시간을 반환합니다 (초 단위)
 */
export function getEpisodeVoteTimeLeft(episodeId: number): number | null {
  try {
    const ttlMap = getVotedEpisodesTTL();
    const voteTimeLeft = ttlMap[episodeId.toString()];
    const now = Date.now();
    const expiryTime = Date.now() + (voteTimeLeft * 1000);
    
    if (voteTimeLeft && expiryTime > now) {
      return voteTimeLeft;
    }
    
    return null;
  } catch (error) {
    console.error('에피소드 투표 시간 확인 실패:', error);
    return null;
  }
}

/**
 * 모든 에피소드의 투표 남은 시간을 반환합니다 (개발/디버깅용)
 */
export function getAllEpisodesVoteTimeLeft(): Record<number, number> {
  try {
    const ttlMap = getVotedEpisodesTTL();
    const result: Record<number, number> = {};
    const now = Date.now();
    
    Object.entries(ttlMap).forEach(([episodeIdStr, voteTimeLeft]) => {
      const episodeId = parseInt(episodeIdStr);
      const expiryTime = Date.now() + (voteTimeLeft * 1000);
      
      if (expiryTime > now) {
        result[episodeId] = voteTimeLeft;
      }
    });
    
    return result;
  } catch (error) {
    console.error('모든 에피소드 투표 시간 확인 실패:', error);
    return {};
  }
}

// 기존 함수들과의 호환성을 위한 래퍼 함수들
export function addVotedEpisode(episodeId: number): void {
  // 기본 TTL을 7일로 설정 (기존 로직과 호환)
  addVotedEpisodeWithTTL(episodeId, 7 * 24 * 60 * 60);
}

/**
 * TTL이 만료되었는지 확인합니다 (외부에서 사용 가능)
 */
export function isVoteDataExpired(): boolean {
  const votedEpisodes = getVotedEpisodes();
  return votedEpisodes.length === 0;
}