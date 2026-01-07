/**
 * 순위 변동 타입 결정 함수
 */
export function getRankDiffType(
  rankDiff: number | null,
  consecutiveWeeks: number | null = 0,
  isAnilab: boolean = false
):
  | 'up-greater-equal-than-5'
  | 'up-less-than-5'
  | 'down-less-than-5'
  | 'down-greater-equal-than-5'
  | 'same-rank'
  | 'new'
  | 'Zero' {
  if (rankDiff === null) return 'new';

  // rankDiff가 0이 아니면 up/down 우선 처리
  if (rankDiff > 0) {
    return rankDiff >= 5 ? 'up-greater-equal-than-5' : 'up-less-than-5';
  }
  if (rankDiff < 0) {
    return rankDiff <= -5 ? 'down-greater-equal-than-5' : 'down-less-than-5';
  }

  // rankDiff가 0인 경우 consecutiveWeeks로 판단
  if (consecutiveWeeks && consecutiveWeeks >= 2) {
    return 'same-rank';
  }

  if (consecutiveWeeks === 1 && !isAnilab) {
    return 'new';
  }

  return 'Zero';
}

/**
 * 별점 분포 배열 생성 함수 (절대값을 비율로 변환)
 */
export function createDistributionArray(
  voteResult: any,
  week: string
): number[] {
  // voteResult가 없거나 voterCount가 없으면 빈 배열 반환
  if (
    !voteResult ||
    voteResult.voterCount === undefined ||
    voteResult.voterCount === null
  ) {
    const isIntegerMode =
      week.includes('25년 4분기 1주차') || week.includes('25년 4분기 2주차');
    return isIntegerMode ? [0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  const totalVoters = voteResult.voterCount;
  const starInfo = voteResult.info;

  if (totalVoters === 0 || !starInfo) {
    // 25년 4분기 1-2주차는 1점 단위 (5개), 나머지는 0.5점 단위 (10개)
    const isIntegerMode =
      week.includes('25년 4분기 1주차') || week.includes('25년 4분기 2주차');
    return isIntegerMode ? [0, 0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  }

  // 25년 4분기 1-2주차는 1점 단위 데이터 사용
  const isIntegerMode =
    week.includes('25년 4분기 1주차') || week.includes('25년 4분기 2주차');

  if (isIntegerMode) {
    // 1점 단위: 1점, 2점, 3점, 4점, 5점
    return [
      (starInfo.star_1_0 ?? 0) / totalVoters,
      (starInfo.star_2_0 ?? 0) / totalVoters,
      (starInfo.star_3_0 ?? 0) / totalVoters,
      (starInfo.star_4_0 ?? 0) / totalVoters,
      (starInfo.star_5_0 ?? 0) / totalVoters,
    ];
  } else {
    // 0.5점 단위: 0.5점, 1.0점, 1.5점, ..., 5.0점
    return [
      (starInfo.star_0_5 ?? 0) / totalVoters,
      (starInfo.star_1_0 ?? 0) / totalVoters,
      (starInfo.star_1_5 ?? 0) / totalVoters,
      (starInfo.star_2_0 ?? 0) / totalVoters,
      (starInfo.star_2_5 ?? 0) / totalVoters,
      (starInfo.star_3_0 ?? 0) / totalVoters,
      (starInfo.star_3_5 ?? 0) / totalVoters,
      (starInfo.star_4_0 ?? 0) / totalVoters,
      (starInfo.star_4_5 ?? 0) / totalVoters,
      (starInfo.star_5_0 ?? 0) / totalVoters,
    ];
  }
}
