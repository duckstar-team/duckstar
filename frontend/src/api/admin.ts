import { AdminEpisodeListDto, LogFilterType, Schemas } from '@/types';
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

  return apiCall<Schemas['SubmissionCountSliceDto']>(
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

  return apiCall<Schemas['EpisodeStarDto'][]>(
    `/api/admin/ip?${params.toString()}`
  );
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

// IP 관리 로그 조회 (기존 호환)
export async function getAdminLogsOnIpManagement(
  page: number = 0,
  size: number = 10,
  filterType: LogFilterType = LogFilterType.IP,
  sort?: string[]
) {
  return getAdminLogs(page, size, filterType, sort);
}

// 관리 로그 조회 (공통 - filterType 4종)
export async function getAdminLogs(
  page: number = 0,
  size: number = 10,
  filterType: LogFilterType = LogFilterType.IP,
  sort?: string[]
) {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    filterType: filterType,
  });
  if (sort?.length) {
    sort.forEach((s) => params.append('sort', s));
  }
  return apiCall<Schemas['ManagementLogSliceDto']>(
    `/api/admin/logs?${params.toString()}`
  );
}

// 분기별 애니메이션 목록 조회
export async function getAnimesByQuarter(
  year: number,
  quarter: number,
  page: number = 0,
  size: number = 50,
  sort?: string[]
) {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  if (sort?.length) {
    sort.forEach((s) => params.append('sort', s));
  }
  return apiCall<Schemas['AdminAnimeListDto']>(
    `/api/admin/animes/${year}/${quarter}?${params.toString()}`
  );
}

// 주차별 에피소드(편성표) 조회
export async function getEpisodesByWeek(weekId: number) {
  return apiCall<Schemas['AdminScheduleInfoDto']>(
    `/api/admin/episodes?weekId=${weekId.toString()}`
  );
}

// 애니메이션별 에피소드 목록 조회
export async function getEpisodesByAnimeAdmin(animeId: number) {
  return apiCall<AdminEpisodeListDto>(`/api/admin/animes/${animeId}/episodes`);
}

// 애니메이션 정보 수정 PATCH
export async function updateAnimeInfo(
  animeId: number,
  body: Schemas['InfoRequestDto']
) {
  return apiCall<Schemas['ManagerProfileDto'][]>(
    `/api/admin/animes/${animeId}`,
    { method: 'PATCH', body: JSON.stringify(body) }
  );
}

// 애니메이션 총 화수 수정 POST
export async function updateAnimeTotalEpisodes(
  animeId: number,
  totalEpisodes: number
) {
  return apiCall<Schemas['EpisodeManageResultDto']>(
    `/api/admin/animes/${animeId}/total-episodes`,
    {
      method: 'POST',
      body: JSON.stringify({ totalEpisodes }),
    }
  );
}

// 애니메이션 총 화수 알 수 없음 PATCH
export async function setAnimeTotalEpisodesUnknown(animeId: number) {
  return apiCall<Schemas['EpisodeManageResultDto']>(
    `/api/admin/${animeId}/total-episodes/unknown`,
    {
      method: 'PATCH',
    }
  );
}

// 에피소드 정보 수정 PATCH
export async function patchEpisode(
  episodeId: number,
  request: Schemas['ModifyRequestDto']
) {
  const params = new URLSearchParams();
  params.append('episodeNumber', request.episodeNumber.toString());
  if (request.rescheduledAt) {
    params.append('rescheduledAt', request.rescheduledAt.toString());
  }
  return apiCall<Schemas['ManagerProfileDto'][]>(
    `/api/admin/episodes/${episodeId}?${params.toString()}`,
    { method: 'PATCH' }
  );
}

// 에피소드 휴방 POST
export async function breakEpisode(episodeId: number) {
  return apiCall<Schemas['EpisodeManageResultDto']>(
    `/api/admin/episodes/${episodeId}`,
    { method: 'POST' }
  );
}

// 에피소드 삭제 DELETE
export async function deleteEpisode(episodeId: number) {
  return apiCall<Schemas['ManagerProfileDto']>(
    `/api/admin/episodes/${episodeId}`,
    { method: 'DELETE' }
  );
}

// 에피소드 추가(큐잉) POST
export async function queueEpisode(animeId: number) {
  return apiCall<Schemas['EpisodeManageResultDto']>(
    `/api/admin/animes/${animeId}/episodes`,
    { method: 'POST' }
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
