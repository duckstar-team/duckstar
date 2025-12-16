import {
  EpisodeStarDto,
  IpManagementLogSliceDto,
  SubmissionCountSliceDto,
} from '@/types';
import { apiCall } from './http';

// 애니메이션 등록 API
// TODO: 미사용 확인 필요, 이름 addAnime로 수정
export async function createAnime(animeData: Record<string, unknown>) {
  return apiCall<void>('/api/admin/animes', {
    method: 'POST',
    body: JSON.stringify(animeData),
  });
}

// IP별 제출 수 슬라이스 조회 API
export async function getSubmissionCountGroupByIp(
  page: number = 0,
  size: number = 50,
  sort?: string[]
) {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (sort && sort.length > 0) {
    sort.forEach((s) => params.append('sort', s));
  }

  return apiCall<SubmissionCountSliceDto>(
    `/api/admin/submissions?${params.toString()}`
  );
}

// 특정 주차, 특정 ip 제출 현황 전체 조회 API
export async function getSubmissionsByWeekAndIp(
  weekId: number,
  ipHash: string
) {
  const params = new URLSearchParams({
    weekId: weekId.toString(),
    ipHash: ipHash,
  });

  return apiCall<EpisodeStarDto[]>(`/api/admin/ip?${params.toString()}`);
}

// ip 밴 토글 API
export async function banIp(ipHash: string, enabled: boolean, reason: string) {
  const params = new URLSearchParams({
    ipHash,
    enabled: enabled.toString(),
    reason,
  });
  return apiCall<void>(`/api/admin/ip/ban?${params.toString()}`, {
    method: 'POST',
  });
}

// 특정 주차, 특정 ip와 표 몰수 (전체 차단)
export async function withdrawVotesByWeekAndIp(
  weekId: number,
  ipHash: string,
  reason: string
) {
  const params = new URLSearchParams({
    weekId: weekId.toString(),
    ipHash,
    reason,
  });
  return apiCall<void>(`/api/admin/ip/withdraw?${params.toString()}`, {
    method: 'POST',
  });
}

// 되돌리기 - 특정 주차, 특정 ip와 표 몰수 롤백
export async function undoWithdrawnSubmissions(
  logId: number,
  weekId: number,
  ipHash: string,
  reason: string
) {
  if (!logId || !weekId || !ipHash || !reason) {
    throw new Error('필수 파라미터가 누락되었습니다.');
  }

  const params = new URLSearchParams({
    logId: logId.toString(),
    weekId: weekId.toString(),
    ipHash,
    reason,
  });
  return apiCall<void>(`/api/admin/ip/withdraw/undo?${params.toString()}`, {
    method: 'POST',
  });
}

// IP 관리 로그 조회
export async function getAdminLogsOnIpManagement(
  page: number = 0,
  size: number = 10,
  sort?: string[]
) {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (sort && sort.length > 0) {
    sort.forEach((s) => params.append('sort', s));
  }

  return apiCall<IpManagementLogSliceDto>(
    `/api/admin/submissions/logs?${params.toString()}`
  );
}

// 애니메이션 메인 이미지 수정 API
export async function updateAnimeImage(animeId: number, imageFile: File) {
  const formData = new FormData();
  formData.append('mainImage', imageFile);

  return apiCall<void>(
    `/api/admin/animes/${animeId}`,
    {
      method: 'POST',
      body: formData,
    },
    '애니메이션 이미지 수정 실패'
  );
}
