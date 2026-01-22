import { apiCall } from './http';
import { AgeGroup, BallotType, Gender, Schemas } from '@/types';

// Device fingerprint 생성 함수
async function generateDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'no-fp';
  }

  try {
    const components = [
      navigator.userAgent || '',
      navigator.language || '',
      navigator.languages?.join(',') || '',
      screen.width?.toString() || '',
      screen.height?.toString() || '',
      screen.colorDepth?.toString() || '',
      new Date().getTimezoneOffset().toString(),
      navigator.platform || '',
      navigator.hardwareConcurrency?.toString() || '',
      (navigator as any).deviceMemory?.toString() || '',
    ];

    const fingerprintString = components.join('|');

    // Web Crypto API를 사용한 SHA-256 해시 생성
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 최소 20자 이상이어야 하므로 전체 해시 반환 (64자)
    return hashHex;
  } catch (error) {
    console.error('Fingerprint 생성 실패:', error);
    // Fallback: 간단한 base64 인코딩
    try {
      const components = [
        navigator.userAgent || '',
        navigator.language || '',
        screen.width?.toString() || '',
        screen.height?.toString() || '',
      ];
      const fingerprintString = components.join('|');
      return btoa(fingerprintString)
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 64);
    } catch {
      return 'no-fp';
    }
  }
}

// 별점 투표/수정 API (비로그인 허용)
export async function submitStarVote(
  episodeId: number,
  starScore: number,
  episodeStarId?: number
) {
  const fingerprint = await generateDeviceFingerprint();

  return apiCall<Schemas['VoteResultDto']>('/api/v1/vote/star', {
    method: 'POST',
    headers: {
      'X-DEVICE-FP': fingerprint,
    },
    body: JSON.stringify({
      episodeId,
      starScore,
      episodeStarId,
    }),
  });
}

// 투표 폼(모달) 투표/수정 API (로그인 ONLY)
export async function submitVoteForm(voteData: Record<string, unknown>) {
  const response = await apiCall<Schemas['VoteResultDto']>(
    '/api/v1/vote/star-form',
    {
      method: 'POST',
      body: JSON.stringify(voteData),
    }
  );

  if (!response.isSuccess) {
    throw response;
  }

  return response;
}

// 실시간 투표 리스트 조회 API
export async function getStarCandidates() {
  return apiCall<Schemas['LiveCandidateListDto']>('/api/v1/vote/star');
}

// 주차 후보 목록 조회 API
export async function getCandidateList(
  year: number,
  quarter: number,
  week: number
) {
  return apiCall<Schemas['WeekCandidateDto'][]>(
    `/api/v1/vote/episodes/${year}/${quarter}/${week}`,
    {
      method: 'GET',
    }
  );
}

// 후보 단건 조회 API
export async function getCandidate(episodeId: number) {
  return apiCall<Schemas['CandidateFormDto']>(
    `/api/v1/vote/episodes/${episodeId}`,
    {
      method: 'GET',
    }
  );
}

// 별점 회수 API
export async function withdrawStar(episodeId: number, episodeStarId: number) {
  return apiCall<void>(`/api/v1/vote/withdraw/${episodeId}/${episodeStarId}`, {
    method: 'POST',
  });
}

// Survey 투표 기록 조회 API
export async function getVoteHistory(surveyId: number) {
  return apiCall<Schemas['AnimeVoteHistoryDto']>(
    `/api/v1/vote/surveys/${surveyId}/me`
  );
}

// Survey 재투표 API
export async function revoteAnime(
  submissionId: number,
  requestBody: {
    surveyId: number;
    gender: Gender;
    ageGroup: AgeGroup;
    added: Array<{ candidateId: number; ballotType: BallotType }>;
    removed: Array<{ candidateId: number; ballotType: BallotType }>;
    updated: Array<{ candidateId: number; ballotType: BallotType }>;
  }
) {
  const response = await apiCall<{ isSuccess: boolean }>(
    `/api/v1/vote/surveys/${submissionId}`,
    {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.isSuccess) {
    throw response;
  }

  return response;
}

// Survey 히스토리용 댓글 작성 API (로그인 ONLY)
export async function createSurveyComment(
  surveyId: number,
  requestBody: {
    animeId: number;
    body: string;
    candidateId: number;
  }
) {
  return apiCall<Schemas['SurveyCommentDto']>(
    `/api/v1/vote/surveys/${surveyId}/me`,
    {
      method: 'POST',
      body: JSON.stringify(requestBody),
    }
  );
}
