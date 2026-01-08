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
 * 투표한 episode ID 목록을 가져옵니다 (비회원 투표 내역 확인)
 */
export function getVotedEpisodes(): number[] {
  try {
    // TTL 맵에서 유효한 에피소드 ID들만 추출
    cleanupExpiredEpisodes();
    const ttlMap = getVotedEpisodesTTL();

    return Object.keys(ttlMap).map((id) => parseInt(id));
  } catch (error) {
    console.error('투표 이력 불러오기 실패:', error);
    return [];
  }
}

/**
 * episode ID를 투표 목록에 추가합니다 (비회원 투표 내역 저장)
 */
export function addVotedEpisodeWithTTL(
  episodeId: number,
  voteTimeLeft: number
): void {
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
      const expiryTime = Date.now() + voteTimeLeft * 1000;

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
