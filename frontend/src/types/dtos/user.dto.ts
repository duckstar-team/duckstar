import { Provider, Role } from '../enums';

// Me Preview DTO
export interface MePreviewDto {
  id: number;
  provider: Provider;
  nickname: string;
  profileImageUrl: string;
  role: Role;
  isProfileInitialized: boolean;
}

// Update Profile Response DTO
export interface UpdateProfileResponseDto {
  isChanged: boolean;
  mePreviewDto: MePreviewDto;
}
