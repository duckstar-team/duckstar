import { Schemas } from '@/types';
import { apiCall } from './http';

// 유저 정보 조회 API
export async function getCurrentUser() {
  return apiCall<Schemas['MePreviewDto']>('/api/v1/members/me');
}

// 프로필 수정 API
export async function updateProfile(formData: FormData) {
  return apiCall<Schemas['UpdateReceiptDto']>(
    '/api/v1/members/me/profile',
    {
      method: 'PATCH',
      body: formData,
    },
    '프로필 업데이트 실패'
  );
}
