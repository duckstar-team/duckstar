'use client';

import { cn } from '@/lib';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LiveCandidateDto } from '@/types/dtos';
import StarSubmissionBox from '@/components/domain/star/StarSubmissionBox';
import { submitStarVote, withdrawStar } from '@/api/vote';
import { StarInfoDto, LiveVoteResultDto } from '@/types/dtos';
import { Clock } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import {
  addHours,
  differenceInHours,
  differenceInMinutes,
  differenceInSeconds,
} from 'date-fns';
import { ApiResponse } from '@/api/http';

interface BigCandidateProps {
  anime: LiveCandidateDto;
  className?: string;
  isCurrentSeason?: boolean; // 현재 시즌인지 여부
  voteInfo?: { year: number; quarter: number; week: number } | null; // 투표 정보
  starInfo: StarInfoDto | null; // 별점 정보 (사용자 투표 이력 포함)
  voterCount: number;
  onVoteComplete?: (episodeId: number, voteTimeLeft: number) => void; // 투표 완료 시 호출되는 콜백
}

export default function BigCandidate({
  anime,
  className,
  voteInfo,
  starInfo,
  voterCount,
  onVoteComplete,
}: BigCandidateProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 별점 투표 mutation
  const voteMutation = useMutation({
    mutationFn: async (starScore: number) => {
      // 이미 투표한 경우(수정) episodeStarId 전달
      return await submitStarVote(anime.episodeId, starScore, episodeStarId);
    },
    onMutate: async () => {
      // 처음 투표하는 경우에만 voterCount +1 (수정 시에는 업데이트 안 함)
      const isFirstVote =
        !starInfo?.userStarScore || starInfo.userStarScore === 0;
      if (isFirstVote) {
        setLocalVoterCount((prev) => prev + 1);
      }
      setVoteState('loading');
    },
    onSuccess: (response, starScore) => {
      setVoteState('submitted');
      setIsPanelVisible(true);
      setShowBinIcon(true);
      updateStarDistribution(response, starScore);

      // 응답에서 episodeStarId 저장 (회수 시 사용)
      if (response.result?.info?.episodeStarId) {
        setEpisodeStarId(response.result.info.episodeStarId);
        console.log(episodeStarId);
      }

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
      if (voteInfo) {
        queryClient.invalidateQueries({
          queryKey: [
            'candidateList',
            voteInfo.year,
            voteInfo.quarter,
            voteInfo.week,
          ],
        });
      }
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
    },
    onSuccess: () => {
      setVoteState('submitting');
      setIsPanelVisible(false);
      setShowBinIcon(false);
      setCurrentRating(0);
      setEpisodeStarId(undefined); // 회수 후 episodeStarId 초기화

      // 서버 데이터 동기화
      queryClient.invalidateQueries({
        queryKey: ['starCandidates'],
      });
      // VoteCandidateList와 VoteModal 업데이트를 위해 candidateList 쿼리도 무효화
      if (voteInfo) {
        queryClient.invalidateQueries({
          queryKey: [
            'candidateList',
            voteInfo.year,
            voteInfo.quarter,
            voteInfo.week,
          ],
        });
      }
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

  // 별점 제출 상태 관리 - starInfo가 있고 userStarScore가 있으면 초기 상태를 submitted로 설정
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
    starInfo?.episodeStarId ?? undefined
  );

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
      starInfo.userStarScore &&
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
      starInfo.userStarScore &&
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
      starInfo.userStarScore &&
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
      starInfo.userStarScore &&
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

  // 닫기 버튼 핸들러
  const handleClosePanel = () => {
    console.log('handleClosePanel called');
    setIsPanelVisible(false);
  };

  // 모바일 감지
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // 라벨 띠 호버 핸들러 (데스크톱에서만 호버 시 패널 표시)
  const handleLabelHover = () => {
    if (
      !isMobile &&
      (voteState === 'submitted' || voteState === 'submitting')
    ) {
      setIsPanelVisible(true);
    }
  };

  // 라벨 띠 호버 아웃 핸들러 (데스크톱에서만 호버 해제 시 패널 숨김)
  const handleLabelHoverOut = () => {
    if (!isMobile && voteState !== 'submitted' && voteState !== 'loading') {
      console.log('handleLabelHoverOut called');
      setIsPanelVisible(false);
    }
  };

  // 라벨 띠 클릭 핸들러 (모바일에서만 클릭 시 패널 토글)
  const handleLabelClick = () => {
    if (isMobile && (voteState === 'submitted' || voteState === 'submitting')) {
      console.log('handleLabelClick called, toggling panel');
      // 수정 버튼 클릭 후에는 패널을 강제로 열기
      if (voteState === 'submitting') {
        console.log(
          'handleLabelClick: voteState is submitting, forcing panel open'
        );
        setIsPanelVisible(true);
        return;
      }
      // submitted 상태에서도 패널을 강제로 열기
      if (voteState === 'submitted') {
        console.log(
          'handleLabelClick: voteState is submitted, forcing panel open'
        );
        setIsPanelVisible(true);
        return;
      }
      setIsPanelVisible(!isPanelVisible);
    }
  };

  // 패널 바깥 클릭 핸들러 (상태1에서만 패널 닫기)
  const handleClickOutside = (e: React.MouseEvent) => {
    if (voteState === 'submitting' && isPanelVisible) {
      console.log('handleClickOutside: closing panel');
      setIsPanelVisible(false);
    }
  };

  // 전역 클릭 이벤트 리스너 (카드 밖 클릭 감지)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (voteState === 'submitting' && isPanelVisible) {
        // 클릭된 요소가 현재 카드 내부가 아닌 경우에만 패널 닫기
        const target = e.target as Element;
        const currentCard = document.querySelector(`[data-anime-item]`);

        if (currentCard && !currentCard.contains(target)) {
          console.log('handleGlobalClick: closing panel from outside card');
          setIsPanelVisible(false);
        }
      }
    };

    if (voteState === 'submitting' && isPanelVisible) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [voteState, isPanelVisible]);

  // API 응답을 별점 분포로 변환하는 함수
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
  const {
    animeId,
    mainThumbnailUrl,
    titleKor,
    dayOfWeek,
    scheduledAt,
    genre,
    medium,
  } = anime;
  const [imageError, setImageError] = useState(false);

  // 디데이 계산 함수 (8/22 형식에서 현재 시간까지의 차이)
  const calculateDaysUntilAir = (airTime: string) => {
    const now = new Date();

    // airTime을 dateTime 문자열로 파싱 (예: "2025-01-11T00:00:00")
    const airDate = new Date(airTime);

    // 유효하지 않은 날짜인 경우
    if (isNaN(airDate.getTime())) {
      return 0;
    }

    // 날짜만 비교하기 위해 시간을 00:00:00으로 설정
    const nowDateOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const airDateOnly = new Date(
      airDate.getFullYear(),
      airDate.getMonth(),
      airDate.getDate()
    );

    // 이미 지난 경우 D-DAY로 표시
    if (airDateOnly < nowDateOnly) {
      return 0; // D-DAY로 표시
    }

    // 날짜 차이 계산 (밀리초 단위)
    const diffTime = airDateOnly.getTime() - nowDateOnly.getTime();
    // 날짜 차이를 일 단위로 변환 (Math.floor 사용하여 정확한 일 수 계산)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // 방영 시간 포맷팅
  const formatAirTime = (scheduledAt: string, airTime?: string) => {
    // dateTime 형식인지 확인 (ISO 8601 형식: "T" 포함 또는 숫자와 하이픈/콜론 포함)
    const isDateTimeFormat = (str: string) => {
      return /^\d{4}-\d{2}-\d{2}/.test(str) || str.includes('T');
    };

    // 극장판의 경우 airTime 필드 사용
    if (medium === 'MOVIE' && airTime) {
      if (isDateTimeFormat(airTime)) {
        const date = new Date(airTime);
        if (!isNaN(date.getTime())) {
          const month = date.getMonth() + 1;
          const day = date.getDate();
          return `${month}/${day} 개봉`;
        }
      }
      return `${airTime} 개봉`;
    }

    // 극장판이지만 airTime이 없는 경우 scheduledAt 사용
    if (medium === 'MOVIE' && scheduledAt) {
      const date = new Date(scheduledAt);
      const month = date.getMonth() + 1; // 0부터 시작하므로 +1
      const day = date.getDate();
      return `${month}/${day} 개봉`;
    }

    // UPCOMING 상태이고 airTime이 dateTime 형식인 경우 디데이 계산
    if (status === 'UPCOMING' && airTime && isDateTimeFormat(airTime)) {
      const airDate = new Date(airTime);
      if (!isNaN(airDate.getTime())) {
        const now = new Date();
        const nowDateOnly = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const airDateOnly = new Date(
          airDate.getFullYear(),
          airDate.getMonth(),
          airDate.getDate()
        );

        // 지난 날짜인 경우 시간만 표시
        if (airDateOnly < nowDateOnly) {
          let hours = airDate.getHours();
          const minutes = airDate.getMinutes().toString().padStart(2, '0');
          // 00:00 ~ 04:59인 경우 24시간 더하기
          if (hours < 5) {
            hours += 24;
          }
          return `${hours.toString().padStart(2, '0')}:${minutes}`;
        }

        // 오늘 또는 미래 날짜인 경우 디데이 계산
        const daysUntil = calculateDaysUntilAir(airTime);
        if (daysUntil > 0) {
          return `D-${daysUntil}`;
        } else if (daysUntil === 0) {
          return 'D-DAY';
        }
      }
    }

    // airTime이 있는 경우 우선 사용 (검색 결과 포함)
    if (airTime) {
      // dateTime 형식인 경우 시간만 표시
      if (isDateTimeFormat(airTime)) {
        const airDate = new Date(airTime);
        if (!isNaN(airDate.getTime())) {
          let hours = airDate.getHours();
          const minutes = airDate.getMinutes().toString().padStart(2, '0');
          // 00:00 ~ 04:59인 경우 24시간 더하기
          if (hours < 5) {
            hours += 24;
          }
          const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
          return `${getDayInKorean(dayOfWeek)} ${formattedTime}`;
        }
      }

      // HH:MM 또는 HH:MM:SS 형식인 경우 (LocalTime은 HH:MM:SS로 올 수 있음)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(airTime)) {
        const [hoursStr, minutesStr] = airTime.split(':');
        let hours = parseInt(hoursStr, 10);
        // 00:00 ~ 04:59인 경우 24시간 더하기
        if (hours < 5) {
          hours += 24;
        }
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutesStr}`;
        return `${getDayInKorean(dayOfWeek)} ${formattedTime}`;
      }

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
      return `${getDayInKorean(dayOfWeek)} ${airTime}`;
    }

    // airTime이 없는 경우 scheduledAt 사용
    if (scheduledAt) {
      const date = new Date(scheduledAt);
      let hours = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');
      // 00:00 ~ 04:59인 경우 24시간 더하기
      if (hours < 5) {
        hours += 24;
      }
      return `${getDayInKorean(dayOfWeek)} ${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    // 종영 애니메이션의 경우 "(종영)" 표시 (시즌별 조회에서만)
    if (status === 'ENDED') {
      return '· 종영';
    }

    return '시간 미정';
  };

  // 요일을 한국어로 변환 (한 글자)
  const getDayInKorean = (dayOfWeek: string) => {
    const dayMap: { [key: string]: string } = {
      MONDAY: '월',
      TUESDAY: '화',
      WEDNESDAY: '수',
      THURSDAY: '목',
      FRIDAY: '금',
      SATURDAY: '토',
      SUNDAY: '일',
      NONE: '미정',
      SPECIAL: '특별',
      // 추가 가능한 값들
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

  // 투표 남은 시간 계산 (36시간 기준)
  const getVoteTimeRemaining = () => {
    if (!scheduledAt) return '시간 미정';

    const now = new Date();
    const scheduled = new Date(scheduledAt);
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

  return (
    <div
      data-anime-item
      className={cn(
        'overflow-hidden rounded-2xl transition-all duration-200 dark:bg-zinc-800',
        // submitted 상태가 아닐 때만 호버 스케일 효과 적용
        voteState !== 'submitted' ? 'hover:scale-[1.02]' : '',
        // submitted 상태일 때는 약간의 그림자 강화로 투표 완료 상태임을 시각적으로 표현
        voteState === 'submitted' ? 'shadow-[0_4px_12px_rgba(0,0,0,0.15)]' : '',
        'flex h-full w-[285px] flex-col',
        'shadow-[0_1.9px_7.2px_rgba(0,0,0,0.1)]',
        'group', // cursor-pointer와 onClick 제거
        className
      )}
      onClick={handleClickOutside}
    >
      {/* Thumbnail Image */}
      <div
        className="relative h-[340px] w-full cursor-pointer overflow-hidden"
        onClick={() => router.push(`/animes/${animeId}`)}
      >
        {localVoterCount > 0 && (
          <span className="absolute top-2 left-2 rounded-md bg-gray-800 px-2 py-1 text-xs font-bold text-white">
            {localVoterCount}명 참여
          </span>
        )}
        <img
          src={mainThumbnailUrl}
          alt={titleKor}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title and Air Time Section */}
        <div className="flex min-h-[120px] flex-col">
          {/* Title - 고정 높이로 2줄 기준 설정 */}
          <div className="relative h-[48px]">
            <h3
              className="hover:text-brand line-clamp-2 cursor-pointer text-[16px] leading-tight font-bold transition-colors"
              onClick={() => router.push(`/animes/${animeId}`)}
            >
              {titleKor}
            </h3>

            {/* 제목 아래 회색선 - 제목 프레임 내에서 아래 왼쪽 정렬 */}
            <div className="absolute bottom-0 left-0 h-0 w-[90px]">
              <div className="h-[1px] w-full bg-[#ced4da] dark:bg-zinc-700"></div>
            </div>
          </div>

          {/* Air Time and Countdown */}
          <div className="mt-[9px] flex items-center">
            <div className="flex items-center gap-2">
              {(() => {
                const airTimeText = formatAirTime(
                  scheduledAt,
                  anime.airTime || ''
                );
                const isUpcomingCountdown =
                  status === 'UPCOMING' && airTimeText.includes('D-');

                if (isUpcomingCountdown) {
                  // UPCOMING 상태의 "D-" 텍스트에 검정 바탕에 흰 글씨 스타일 적용
                  // scheduledAt에서 시간 추출
                  const getTimeFromScheduledAt = (scheduledAt: string) => {
                    if (!scheduledAt) return '';
                    const date = new Date(scheduledAt);
                    let hours = date.getHours();
                    const minutes = date
                      .getMinutes()
                      .toString()
                      .padStart(2, '0');
                    // 00:00 ~ 04:59인 경우 24시간 더하기
                    if (hours < 5) {
                      hours += 24;
                    }
                    return `${hours.toString().padStart(2, '0')}:${minutes}`;
                  };

                  return (
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-[#868E96]">
                        {medium === 'MOVIE'
                          ? getDayInKorean(dayOfWeek) // 극장판은 요일만 표시
                          : medium === 'TVA' &&
                              (dayOfWeek === 'NONE' || dayOfWeek === 'SPECIAL')
                            ? getDayInKorean(dayOfWeek)
                            : getDayInKorean(dayOfWeek)}
                      </span>
                      <span className="rounded bg-black px-2 py-1 text-[13px] font-bold text-white">
                        {airTimeText}
                      </span>
                      <span className="text-[14px] font-medium text-[#868E96]">
                        {getTimeFromScheduledAt(scheduledAt)}
                      </span>
                    </div>
                  );
                } else {
                  // 일반적인 airTime 표시
                  return (
                    <span className="text-[14px] font-medium text-[#868E96]">
                      {formatAirTime(scheduledAt, anime.airTime || '')}
                    </span>
                  );
                }
              })()}
              {/* {isRescheduled && (
                <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-600">
                  편성 변경
                </span>
              )} */}
            </div>
            {/* 투표 남은 시간 배지 */}
            <div className="w-[7px]"></div>
            <div
              className={`flex items-center rounded-md px-2 py-0.5 ${getVoteTimeRemaining() === '종료' ? 'bg-black' : 'bg-brand'}`}
            >
              <span className="flex items-center gap-1 text-[13px] font-bold text-white">
                <Clock size={14} /> 투표: {getVoteTimeRemaining()}{' '}
                {getVoteTimeRemaining() === '종료' ? '' : '남음'}
              </span>
            </div>
          </div>

          {/* Genres - 제목 섹션에 포함 */}
          <div className="mt-[5px]">
            <span className="text-[13px] font-medium text-[#868E96]">
              {genre}
            </span>
          </div>
        </div>
      </div>

      {/* 라벨 띠 - 카드 호버 시 디자인 변경, 라벨 띠 호버 시 블랙박스 */}
      <div
        className={`h-6 bg-[#F1F3F5] dark:bg-zinc-700 ${
          voteState === 'submitted' && isPanelVisible
            ? 'bg-black'
            : 'group-hover:bg-black hover:bg-black'
        } group/label relative cursor-pointer transition-colors duration-200`}
        onMouseEnter={handleLabelHover}
        onMouseLeave={handleLabelHoverOut}
        onClick={handleLabelClick}
      >
        {/* 힌트 디자인 - 카드 호버 시 스타일 변경 (submitted 상태가 아니거나 패널이 숨겨진 경우 표시) */}
        {(voteState !== 'submitted' || !isPanelVisible) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="text-xs font-medium text-gray-600 opacity-70 transition-all duration-200 group-hover:text-white group-hover:opacity-100 dark:text-zinc-100">
                {voteState === 'submitted'
                  ? '투표 내역 보기'
                  : '마우스를 올려서 투표'}
              </div>
              <div className="h-0 w-0 animate-bounce border-r-[6px] border-b-[6px] border-l-[6px] border-transparent border-b-gray-600 opacity-60 transition-all duration-200 group-hover:border-b-white group-hover:opacity-100 dark:border-b-zinc-100"></div>
            </div>
          </div>
        )}

        {/* 라벨 띠 호버 시에만 올라오는 블랙박스 (submitted 상태에서는 항상 표시, 닫기 버튼으로 숨김 가능) */}
        <div
          className={`absolute right-0 bottom-0 left-0 h-[119px] bg-black transition-transform duration-300 ease-out ${
            voteState === 'submitted' || voteState === 'submitting'
              ? isPanelVisible
                ? 'translate-y-0'
                : 'translate-y-full'
              : 'translate-y-full group-hover/label:translate-y-0'
          }`}
          style={{ cursor: 'default !important' }}
        >
          {/* StarSubmissionBox 사용 */}
          <StarSubmissionBox
            currentRating={currentRating}
            averageRating={averageRating}
            participantCount={localVoterCount}
            distribution={distribution}
            episodeId={anime.episodeId}
            variant={voteState}
            voteInfo={voteInfo}
            showBinIcon={showBinIcon}
            onRatingReset={() => {
              // bin 버튼 클릭 시 즉시 별점 초기화
              setCurrentRating(0);
            }}
            onWithdrawComplete={() => {
              // 별점 회수 mutation 실행
              withdrawMutation.mutate();
            }}
            onRatingChange={(rating) => {
              console.log('onRatingChange called with rating:', rating);

              setCurrentRating(rating);

              if (rating > 0) {
                console.log('Rating > 0, proceeding with vote');
                // 별점을 0.5-5.0에서 1-10으로 변환 (2배)
                const starScore = Math.round(rating * 2);
                // 투표 mutation 실행
                voteMutation.mutate(starScore);
              } else {
                console.log('Rating = 0, closing panel without submission');
                // 0점일 때 패널 닫기 (제출하지 않음)
                setIsPanelVisible(false);
                setVoteState('submitting'); // 제출 상태로 되돌림
              }
            }}
            onEditClick={() => {
              console.log(
                'onEditClick called, current isPanelVisible:',
                isPanelVisible
              );
              setVoteState('submitting');
              // 수정 버튼 클릭 시 패널 강제 유지 (모바일/데스크톱 모두)
              setIsPanelVisible(true);
              // 수정 시 기존 별점 유지 (초기화하지 않음)
              console.log(
                'onEditClick: setIsPanelVisible(true) called, keeping current rating'
              );
            }}
            onCloseClick={
              voteState === 'submitted' ? () => handleClosePanel() : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
