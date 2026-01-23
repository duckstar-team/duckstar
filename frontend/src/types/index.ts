/**
 * components['schemas'] 타입을 직접 접근 가능하도록 export
 */
import type { components } from './generated/api';
export type Schemas = components['schemas'];

/**
 * 자주 사용되는 schema 타입을 직접 export
 */
export type WeekDto = Schemas['WeekDto'];
export type PageInfo = Schemas['PageInfo'];

/**
 * 백엔드 enum 이름과 동일하게 별칭으로 재정의하여 export
 */
// Anime 관련
export { AnimePreviewDtoStatus as AnimeStatus } from './generated/api';
export { PostRequestDtoDayOfWeek as DayOfWeek } from './generated/api';
export { OttDtoOttType as OttType } from './generated/api';
export { PostRequestDtoMedium as Medium } from './generated/api';

// User 관련
export { MePreviewDtoProvider as Provider } from './generated/api';
export { MePreviewDtoRole as Role } from './generated/api';
export { ReplyDtoStatus as CommentStatus } from './generated/api';
export { ManagerProfileDtoTaskType as AdminTaskType } from './generated/api';

// Vote 관련
export { BallotRequestDtoBallotType as BallotType } from './generated/api';
export { AnimeVoteRequestGender as Gender } from './generated/api';
export { AnimeVoteRequestAgeGroup as AgeGroup } from './generated/api';
export { SurveyDtoStatus as SurveyStatus } from './generated/api';
export { SurveyDtoType as SurveyType } from './generated/api';
export { WeekCandidateDtoState as EpEvaluateState } from './generated/api';

// Chart 관련
export { HomeBannerDtoBannerType as BannerType } from './generated/api';
export { HomeBannerDtoContentType as ContentType } from './generated/api';
export { MedalPreviewDtoType as MedalType } from './generated/api';

// Admin 관련
export type OttDto = Schemas['OttDto'];
export type IpManagementLogDto = Schemas['IpManagementLogDto'];
export type SubmissionCountDto = Schemas['SubmissionCountDto'];
