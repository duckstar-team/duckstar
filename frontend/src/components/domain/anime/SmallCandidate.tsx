'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { StarInfoDto, LiveVoteResultDto, AnimePreviewDto } from '@/types';
import StarRatingSimple from '@/components/domain/star/StarRatingSimple';
import StarDistributionChart from '@/components/domain/star/StarDistributionChart';
import { submitStarVote, withdrawStar } from '@/api/vote';
import { addVotedEpisode } from '@/lib/voteStorage';
import { Clock } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  addHours,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from 'date-fns';
import { ApiResponse } from '@/api/http';

interface SmallCandidateProps {
  anime: AnimePreviewDto;
  isCurrentSeason: boolean;
  voteInfo: {
    year: number;
    quarter: number;
    week: number;
  };
  starInfo: StarInfoDto | null;
  voterCount: number;
  onVoteComplete?: (episodeId: number, voteTimeLeft: number) => void;
}

// 영어 요일을 한글로 변환하는 함수
const getKoreanDayOfWeek = (dayOfWeek: string): string => {
  const dayMap: { [key: string]: string } = {
    MON: '월',
    TUE: '화',
    WED: '수',
    THU: '목',
    FRI: '금',
    SAT: '토',
    SUN: '일',
  };
  return dayMap[dayOfWeek] || dayOfWeek;
};

// 방영 시간 포맷팅 (BigCandidate와 동일한 로직)
const formatAirTime = (anime: AnimePreviewDto) => {
  const { scheduledAt, airTime, dayOfWeek, status, medium } = anime;

  // 극장판의 경우 airTime 필드 사용 (8/17 형식)
  if (medium === 'MOVIE' && airTime) {
    return `${airTime} 개봉`;
  }

  // 극장판이지만 airTime이 없는 경우 scheduledAt 사용
  if (medium === 'MOVIE' && scheduledAt) {
    const date = new Date(scheduledAt);
    const month = date.getMonth() + 1; // 0부터 시작하므로 +1
    const day = date.getDate();
    return `${month}/${day} 개봉`;
  }

  // airTime이 있는 경우 우선 사용 (검색 결과 포함)
  if (airTime) {
    // airTime에 이미 요일이 포함되어 있으면 그대로 사용
    if (
      airTime.includes('요일') ||
      airTime.includes('일') ||
      airTime.includes('월') ||
      airTime.includes('화') ||
      airTime.includes('수') ||
      airTime.includes('목') ||
      airTime.includes('금') ||
      airTime.includes('토')
    ) {
      return airTime;
    }
    // 요일이 없으면 요일 추가
    return `${getKoreanDayOfWeek(dayOfWeek || '')} ${airTime}`;
  }

  // airTime이 없는 경우 scheduledAt 사용
  if (scheduledAt) {
    const date = new Date(scheduledAt);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${getKoreanDayOfWeek(dayOfWeek || '')} ${hours}:${minutes}`;
  }

  // 종영 애니메이션의 경우 "(종영)" 표시
  if (status === 'ENDED') {
    return '· 종영';
  }

  return '시간 미정';
};

export default function SmallCandidate({
  anime,
  voteInfo,
  starInfo,
  voterCount,
  onVoteComplete,
}: SmallCandidateProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 별점 투표 mutation
  const voteMutation = useMutation({
    mutationFn: async (starScore: number) => {
      // 이미 투표한 경우(수정) episodeStarId 전달
      return await submitStarVote(anime.episodeId, starScore, episodeStarId);
    },
    onMutate: async (starScore) => {
      // 처음 투표하는 경우에만 voterCount +1 (수정 시에는 업데이트 안 함)
      const isFirstVote =
        !starInfo?.userStarScore || starInfo.userStarScore === 0;
      if (isFirstVote) {
        setLocalVoterCount((prev) => prev + 1);
      }
      setVoteState('loading');
      setIsEditMode(true);
    },
    onSuccess: (response, starScore) => {
      setVoteState('submitted');
      setIsPanelVisible(true);
      setShowBinIcon(true);
      setIsEditMode(false);
      updateStarDistribution(response, starScore);
      addVotedEpisode(anime.episodeId);

      // 응답에서 episodeStarId 저장 (회수 시 사용)
      if (response.result?.info?.episodeStarId) {
        setEpisodeStarId(response.result.info.episodeStarId);
      }

      // 호버 상태 강제 리셋을 위한 지연
      setTimeout(() => {
        const starElements = document.querySelectorAll('[data-star-rating]');
        starElements.forEach((element) => {
          element.dispatchEvent(new Event('mouseleave'));
        });
      }, 100);

      // 투표 남은 시간 계산
      const now = new Date();
      const scheduled = new Date(anime.scheduledAt);
      const voteEndTime = addHours(scheduled, 36);
      const voteTimeLeft = Math.max(0, differenceInSeconds(voteEndTime, now));

      // 서버 데이터 동기화
      queryClient.invalidateQueries({
        queryKey: ['starCandidates'],
      });
      // VoteCandidateList와 VoteModal 업데이트를 위해 candidateList 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: [
          'candidateList',
          voteInfo.year,
          voteInfo.quarter,
          voteInfo.week,
        ],
      });
      // VoteModal 업데이트를 위해 candidate 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: ['candidate', anime.episodeId],
      });

      if (onVoteComplete) {
        onVoteComplete(anime.episodeId, voteTimeLeft);
      }
    },
    onError: (error) => {
      // 에러 시 optimistic update 롤백 (처음 투표인 경우에만)
      const isFirstVote =
        !starInfo?.userStarScore || starInfo.userStarScore === 0;
      if (isFirstVote) {
        setLocalVoterCount((prev) => Math.max(0, prev - 1));
      }
      setVoteState('submitting');
      setIsEditMode(false);
      console.error('투표 중 오류:', error);
    },
  });

  // 별점 회수 mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!episodeStarId) {
        throw new Error('episodeStarId가 없습니다.');
      }
      return await withdrawStar(anime.episodeId, episodeStarId);
    },
    onMutate: async () => {
      // Optimistic update: 즉시 voterCount -1
      setLocalVoterCount((prev) => Math.max(0, prev - 1));
      setCurrentRating(0);
    },
    onSuccess: () => {
      setVoteState('submitting');
      setIsPanelVisible(false);
      setShowBinIcon(false);
      setIsEditMode(false);
      setEpisodeStarId(undefined); // 회수 후 episodeStarId 초기화

      // 서버 데이터 동기화
      queryClient.invalidateQueries({
        queryKey: ['starCandidates'],
      });
      // VoteCandidateList와 VoteModal 업데이트를 위해 candidateList 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: [
          'candidateList',
          voteInfo.year,
          voteInfo.quarter,
          voteInfo.week,
        ],
      });
      // VoteModal 업데이트를 위해 candidate 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: ['candidate', anime.episodeId],
      });

      if (onVoteComplete) {
        onVoteComplete(anime.episodeId, 0);
      }
    },
    onError: (error) => {
      // 에러 시 optimistic update 롤백
      setLocalVoterCount((prev) => prev + 1);
      console.error('별점 회수 실패:', error);
    },
  });

  // BigCandidate와 동일한 상태 관리
  const [voteState, setVoteState] = useState<
    'submitting' | 'loading' | 'submitted'
  >(
    starInfo && starInfo.userStarScore && starInfo.userStarScore > 0
      ? 'submitted'
      : 'submitting'
  );
  const [currentRating, setCurrentRating] = useState(
    starInfo && starInfo.userStarScore && starInfo.userStarScore > 0
      ? starInfo.userStarScore / 2
      : 0
  );

  // episodeStarId를 state로 관리 (투표 후 응답에서 받아옴)
  const [episodeStarId, setEpisodeStarId] = useState<number | undefined>(
    starInfo?.episodeStarId
  );

  // starInfo가 변경되면 episodeStarId 동기화
  useEffect(() => {
    if (starInfo?.episodeStarId) {
      setEpisodeStarId(starInfo.episodeStarId);
    }
  }, [starInfo?.episodeStarId]);

  // starInfo가 변경되면 episodeStarId 동기화
  useEffect(() => {
    if (starInfo?.episodeStarId) {
      setEpisodeStarId(starInfo.episodeStarId);
    }
  }, [starInfo?.episodeStarId]);

  // 별점 분포 데이터 상태 관리 - starInfo가 있으면 초기값 설정
  // isBlocked가 true면 유저의 별점을 가산해서 계산 (사용자가 눈치채지 못하도록)
  const [averageRating, setAverageRating] = useState(() => {
    if (!starInfo) return 0;

    // isBlocked가 true이고 userStarScore가 있으면 가산 처리
    if (
      starInfo.isBlocked &&
      starInfo.userStarScore !== undefined &&
      starInfo.userStarScore > 0
    ) {
      const newVoterCount = voterCount + 1;
      const newDistributionArray = [
        starInfo.star_0_5,
        starInfo.star_1_0,
        starInfo.star_1_5,
        starInfo.star_2_0,
        starInfo.star_2_5,
        starInfo.star_3_0,
        starInfo.star_3_5,
        starInfo.star_4_0,
        starInfo.star_4_5,
        starInfo.star_5_0,
      ];
      const userStarIndex = starInfo.userStarScore - 1;
      if (userStarIndex >= 0 && userStarIndex < newDistributionArray.length) {
        newDistributionArray[userStarIndex] += 1;
      }
      const weights = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
      const weightedSum = newDistributionArray.reduce(
        (sum, count, index) => sum + weights[index] * count,
        0
      );
      const newStarAverage =
        newVoterCount > 0 ? weightedSum / newVoterCount : 0;
      return newStarAverage / 2;
    }
    return starInfo.starAverage / 2;
  });

  // voterCount를 로컬 state로 관리 (즉시 업데이트를 위해)
  const [localVoterCount, setLocalVoterCount] = useState(() => {
    if (
      starInfo &&
      starInfo.isBlocked &&
      starInfo.userStarScore !== undefined &&
      starInfo.userStarScore > 0
    ) {
      return voterCount + 1;
    }
    return voterCount;
  });

  // props의 voterCount가 변경되면 로컬 state 동기화
  useEffect(() => {
    if (
      starInfo &&
      starInfo.isBlocked &&
      starInfo.userStarScore !== undefined &&
      starInfo.userStarScore > 0
    ) {
      setLocalVoterCount(voterCount + 1);
    } else {
      setLocalVoterCount(voterCount);
    }
  }, [voterCount, starInfo]);

  const [distribution, setDistribution] = useState(() => {
    if (!starInfo) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // isBlocked가 true이고 userStarScore가 있으면 가산 처리
    if (
      starInfo.isBlocked &&
      starInfo.userStarScore !== undefined &&
      starInfo.userStarScore > 0
    ) {
      const newVoterCount = voterCount + 1;
      const newDistributionArray = [
        starInfo.star_0_5,
        starInfo.star_1_0,
        starInfo.star_1_5,
        starInfo.star_2_0,
        starInfo.star_2_5,
        starInfo.star_3_0,
        starInfo.star_3_5,
        starInfo.star_4_0,
        starInfo.star_4_5,
        starInfo.star_5_0,
      ];
      const userStarIndex = starInfo.userStarScore - 1;
      if (userStarIndex >= 0 && userStarIndex < newDistributionArray.length) {
        newDistributionArray[userStarIndex] += 1;
      }
      return newDistributionArray.map((count) => count / newVoterCount);
    }

    // 정상적인 경우
    if (voterCount > 0) {
      const totalVotes = voterCount;
      return [
        starInfo.star_0_5 / totalVotes,
        starInfo.star_1_0 / totalVotes,
        starInfo.star_1_5 / totalVotes,
        starInfo.star_2_0 / totalVotes,
        starInfo.star_2_5 / totalVotes,
        starInfo.star_3_0 / totalVotes,
        starInfo.star_3_5 / totalVotes,
        starInfo.star_4_0 / totalVotes,
        starInfo.star_4_5 / totalVotes,
        starInfo.star_5_0 / totalVotes,
      ];
    }
    return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  });

  // 별점 패널 표시 상태 관리 (submitted 상태에서 닫기 버튼으로 숨길 수 있음)
  // 이미 투표한 경우(submitted 상태) 패널을 미리 열어둠
  const [isPanelVisible, setIsPanelVisible] = useState(
    starInfo && starInfo.userStarScore && starInfo.userStarScore > 0
  );

  // bin 아이콘 표시 여부 관리 (별점 회수 후에는 false, 새로 투표하면 true)
  const [showBinIcon, setShowBinIcon] = useState(
    !!(starInfo && starInfo.userStarScore && starInfo.userStarScore > 0)
  );

  // 수정 모드 상태 관리 (사용자가 별점을 클릭해서 수정할 때만 true)
  const [isEditMode, setIsEditMode] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // 별점 분포 업데이트 함수 (BigCandidate와 동일)
  const updateStarDistribution = (
    response: ApiResponse<LiveVoteResultDto>,
    userStarScore?: number
  ) => {
    if (response.result.info) {
      const {
        isBlocked,
        starAverage,
        star_0_5,
        star_1_0,
        star_1_5,
        star_2_0,
        star_2_5,
        star_3_0,
        star_3_5,
        star_4_0,
        star_4_5,
        star_5_0,
      } = response.result.info;

      // isBlocked가 true면 유저의 별점을 가산해서 계산 (사용자가 눈치채지 못하도록)
      if (isBlocked && userStarScore !== undefined) {
        // 참여자 수: 기존 + 1
        const newVoterCount = response.result.voterCount + 1;

        // 별점 분포: 기존 분포에 유저의 별점을 가산
        const newDistributionArray = [
          star_0_5,
          star_1_0,
          star_1_5,
          star_2_0,
          star_2_5,
          star_3_0,
          star_3_5,
          star_4_0,
          star_4_5,
          star_5_0,
        ];

        // 유저의 별점에 해당하는 인덱스 찾기
        // starScore는 1-10 스케일이고, 분포 배열은 0.5, 1.0, ..., 5.0 (10개)
        // starScore 1 -> 0.5점 (인덱스 0), starScore 2 -> 1.0점 (인덱스 1), ..., starScore 10 -> 5.0점 (인덱스 9)
        const userStarIndex = userStarScore - 1;
        if (userStarIndex >= 0 && userStarIndex < newDistributionArray.length) {
          newDistributionArray[userStarIndex] += 1;
        }

        // 별점 분포 배열을 사용해서 정확한 평균 계산 (백엔드와 동일한 방식)
        // 백엔드는 1-10 스케일로 weightedSum을 계산: 1.0*star_0_5 + 2.0*star_1_0 + ... + 10.0*star_5_0
        const weights = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
        const weightedSum = newDistributionArray.reduce(
          (sum, count, index) => sum + weights[index] * count,
          0
        );
        const newStarAverage =
          newVoterCount > 0 ? weightedSum / newVoterCount : 0;

        // 비율로 변환
        const newDistribution = newDistributionArray.map(
          (count) => count / newVoterCount
        );

        setAverageRating(newStarAverage / 2);
        setDistribution(newDistribution);
      } else {
        // 정상적인 경우 기존 로직 사용
        setAverageRating(starAverage / 2);

        // 별점 분포를 비율로 변환 (0.5점 단위)
        const totalVotes = response.result.voterCount;
        if (totalVotes > 0) {
          const newDistribution = [
            star_0_5 / totalVotes,
            star_1_0 / totalVotes,
            star_1_5 / totalVotes,
            star_2_0 / totalVotes,
            star_2_5 / totalVotes,
            star_3_0 / totalVotes,
            star_3_5 / totalVotes,
            star_4_0 / totalVotes,
            star_4_5 / totalVotes,
            star_5_0 / totalVotes,
          ];
          setDistribution(newDistribution);
        }
      }
    }
  };

  // 닫기 버튼 핸들러 (BigCandidate와 동일)
  const handleClosePanel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPanelVisible(false);
  };

  // 투표 남은 시간 계산 (BigCandidate와 동일한 로직)
  const getVoteTimeRemaining = () => {
    if (!anime.scheduledAt) return '시간 미정';

    const now = new Date();
    const scheduled = new Date(anime.scheduledAt);
    const voteEndTime = addHours(scheduled, 36); // 36시간 후

    // 투표 시간이 지났으면 "종료"
    if (voteEndTime <= now) {
      return '종료';
    }

    const hours = differenceInHours(voteEndTime, now);
    const minutes = differenceInMinutes(voteEndTime, now) - hours * 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분 남음`;
    } else {
      return `${minutes}분 남음`;
    }
  };

  // 375px 미만에서만 "남음" 제거한 시간 표시
  const getVoteTimeRemainingShort = () => {
    if (!anime.scheduledAt) return '시간 미정';

    const now = new Date();
    const scheduled = new Date(anime.scheduledAt);
    const voteEndTime = addHours(scheduled, 36);

    // 투표 시간이 지났으면 "종료"
    if (voteEndTime <= now) {
      return '종료';
    }

    const hours = differenceInHours(voteEndTime, now);
    const minutes = differenceInMinutes(voteEndTime, now) - hours * 60;

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    } else {
      return `${minutes}분`;
    }
  };

  // 시간 계산
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const remaining = getVoteTimeRemaining();
      setTimeRemaining(remaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // 1분마다 업데이트

    return () => clearInterval(interval);
  }, [anime.scheduledAt]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-5">
        {/* 썸네일 */}
        <div className="flex-shrink-0">
          <div
            className="relative cursor-pointer"
            onClick={() => router.push(`/animes/${anime.animeId}`)}
          >
            {localVoterCount > 0 && (
              <span className="absolute top-1 left-1 rounded-md bg-gray-800 px-2 py-1 text-xs font-bold text-white">
                {localVoterCount}명 참여
              </span>
            )}
            <img
              src={anime.mainThumbnailUrl || ''}
              alt={anime.titleKor || '제목 없음'}
              className="xs:w-[108px] xs:h-[144px] h-[120px] w-[90px] rounded-lg bg-gray-200 object-cover"
            />
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="min-w-0 flex-1">
          {/* 제목과 시간 정보 */}
          <div className="mb-2">
            <h3
              className="mb-2 line-clamp-2 h-[3rem] cursor-pointer text-lg leading-tight font-semibold text-black transition-colors hover:text-[#990033] md:line-clamp-3 md:h-[4.5rem]"
              onClick={() => router.push(`/animes/${anime.animeId}`)}
            >
              {anime.titleKor || '제목 없음'}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>{formatAirTime(anime)}</span>
              {timeRemaining &&
                timeRemaining !== '시간 미정' &&
                timeRemaining !== '종료' && (
                  <div className="rounded bg-[#990033] px-2 py-1 text-xs font-bold text-white">
                    <span className="hidden items-center gap-1 sm:flex">
                      <Clock size={14} /> 투표: {getVoteTimeRemainingShort()}{' '}
                      남음
                    </span>
                    <span className="flex items-center gap-1 sm:hidden">
                      <Clock size={14} /> <span>투표: {timeRemaining}</span>
                    </span>
                  </div>
                )}
            </div>
          </div>

          {/* 장르와 별점을 같은 줄에 배치 */}
          <div className="relative flex items-center justify-end sm:justify-between">
            <span className="hidden min-w-0 flex-shrink-1 truncate text-xs text-gray-500 sm:block">
              {anime.genre || ''}
            </span>
            <div className="relative mt-3 flex flex-shrink-0 items-center gap-2 sm:mt-0">
              {/* bin 아이콘 - 수정 모드일 때만 표시 */}
              {isEditMode && showBinIcon && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // 별점 회수 mutation 실행
                    withdrawMutation.mutate();
                  }}
                  className="z-10 mt-1 flex h-6 w-6 items-center justify-center rounded text-gray-400 transition-colors duration-200 hover:bg-white/20 hover:text-white"
                  aria-label="별점 회수"
                >
                  <img
                    src="/icons/bin-icon.svg"
                    alt="별점 회수"
                    className="h-4 w-4"
                  />
                </button>
              )}
              {/* 로딩 상태 표시 */}
              {voteState === 'loading' ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin">
                    <img
                      src="/icons/star/star-Selected.svg"
                      alt="로딩 중"
                      className="h-5 w-5"
                    />
                  </div>
                  <span className="text-xs text-gray-500">투표 처리 중...</span>
                </div>
              ) : (
                <>
                  {/* BigCandidate와 동일한 별점 컴포넌트 */}
                  <StarRatingSimple
                    key={`star-${anime.episodeId}-${currentRating}`}
                    initialRating={currentRating}
                    readOnly={!!isPanelVisible}
                    onRatingChange={
                      isPanelVisible
                        ? undefined
                        : (rating) => {
                            console.log(
                              'onRatingChange called with rating:',
                              rating
                            );

                            setCurrentRating(rating);

                            if (rating > 0) {
                              console.log('Rating > 0, proceeding with vote');
                              // 별점을 0.5-5.0에서 1-10으로 변환 (2배)
                              const starScore = Math.round(rating * 2);
                              // 투표 mutation 실행
                              voteMutation.mutate(starScore);
                            } else {
                              console.log(
                                'Rating is 0, staying in submitting state'
                              );
                              setVoteState('submitting');
                            }
                          }
                    }
                    size="md"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 별점 분산 통계 블랙박스 (투표 완료 후 표시) */}
      {isPanelVisible && (
        <div className="absolute top-[70px] right-[10px] left-[110px] inline-flex h-28 items-center justify-center gap-5 rounded-tl-xl rounded-tr-xl bg-black pt-2.5 max-[640px]:top-[60px] max-[640px]:h-32 max-[480px]:top-[38px] max-[480px]:right-[5px] max-[480px]:left-[110px] max-[480px]:h-38 max-[480px]:flex-col max-[480px]:gap-3 max-[480px]:pb-3 sm:top-[64px] sm:right-[15px] sm:left-[125px] sm:h-32 md:top-[80px] md:h-24 lg:top-[40px] lg:right-[5px] lg:left-[110px] lg:h-38 lg:flex-col lg:gap-3 lg:pb-3 xl:top-[80px] xl:right-[15px] xl:left-[125px] xl:h-24 xl:flex-row xl:gap-5">
          {/* 수정 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPanelVisible(false);
              setVoteState('submitting');
              setIsEditMode(true); // 수정 모드 활성화
            }}
            className="absolute top-1 right-1 z-5 inline-flex items-center justify-center gap-2.5 rounded-sm px-2 pt-[3px] pb-1 transition-opacity hover:opacity-80"
            style={{
              background: 'linear-gradient(to right, #495057, #343A40)',
            }}
            aria-label="수정"
          >
            <div className="justify-center text-right text-[10px] font-bold whitespace-nowrap text-white">
              수정
            </div>
          </button>
          <div className="flex items-center justify-center gap-3.5 max-[640px]:pb-3 max-[480px]:flex-col max-[480px]:items-end max-[480px]:gap-4 sm:pb-10 md:pb-0 lg:flex-col lg:items-end lg:gap-4 xl:flex-row xl:items-center xl:gap-3.5">
            {/* 평균별점과 막대그래프 (480px 미만에서는 위에 배치) */}
            <div className="flex items-center gap-3.5 max-[480px]:order-1">
              <div className="inline-flex flex-col items-center justify-center gap-1">
                <div className="inline-flex items-center justify-center gap-2">
                  <div className="relative size-4">
                    <img
                      src="/icons/star/star-Selected.svg"
                      alt="별"
                      className="absolute top-0 left-0 h-5 w-5 pb-1"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-0.5">
                    <div className="justify-start text-center text-2xl leading-snug font-semibold text-white">
                      {averageRating.toFixed(1)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-start gap-0.5 pb-1">
                  <div className="inline-flex items-center justify-start gap-1">
                    <div className="justify-start text-right text-sm leading-snug font-medium text-gray-400">
                      {localVoterCount}명 참여
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative h-10 w-24 pt-1">
                <StarDistributionChart
                  distribution={distribution}
                  totalVoters={localVoterCount}
                  width={96}
                  height={40}
                  barWidth={8}
                  barSpacing={2}
                  maxBarColor="#FF7B7B"
                  normalBarColor="rgba(255, 123, 123, 0.66)"
                />
              </div>
            </div>
            {/* 사용자별점 리스트 (480px 미만에서는 아래에 배치) */}
            <div className="relative flex items-center justify-center gap-2.5 max-[480px]:order-2 lg:order-2 xl:order-1">
              <div className="pointer-events-none flex items-center justify-end gap-[0.74px] px-[2.96px] pb-1.5">
                <StarRatingSimple
                  key={`star-small-${anime.episodeId}-${currentRating}`}
                  maxStars={5}
                  initialRating={currentRating}
                  size="sm"
                  withBackground={true}
                  onRatingChange={() => {}} // 읽기 전용
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
