// Me Preview DTO
export interface MePreviewDto {
  id: number;
  provider: 'KAKAO' | 'GOOGLE' | 'NAVER' | 'LOCAL';
  nickname: 'string';
  profileImageUrl: string;
  role: 'ADMIN' | 'USER';
  isProfileInitialized: boolean;
}

// Update Profile Response DTO
export interface UpdateProfileResponseDto {
  isChanged: boolean;
  mePreviewDto: MePreviewDto;
}
