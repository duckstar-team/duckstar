export enum BallotType {
  Bonus = 'BONUS',
  Normal = 'NORMAL',
}

export enum AgeGroup {
  Age15_19 = 'AGE_15_19',
  Age20_24 = 'AGE_20_24',
  Age25_29 = 'AGE_25_29',
  Age30_34 = 'AGE_30_34',
  Over35 = 'OVER_35',
  Under14 = 'UNDER_14',
}

export enum Gender {
  Female = 'FEMALE',
  Male = 'MALE',
  Unknown = 'UNKNOWN',
}

export enum SurveyStatus {
  Closed = 'CLOSED',
  Open = 'OPEN',
  Paused = 'PAUSED',
  NotYet = 'NOT_YET',
  ResultOpen = 'RESULT_OPEN',
}

export enum SurveyType {
  Anticipated = 'ANTICIPATED',
  Q1End = 'Q1_END',
  Q2End = 'Q2_END',
  Q3End = 'Q3_END',
  Q4End = 'Q4_END',
  YearEnd = 'YEAR_END',
}

export enum EpEvaluateState {
  Closed = 'CLOSED', // 투표 종료
  VotingWindow = 'VOTING_WINDOW', // 투표 진행 중
  LoginRequired = 'LOGIN_REQUIRED', // 로그인 필요(늦참 투표)
  AlwaysOpen = 'ALWAYS_OPEN', // 항상 투표 진행
}
