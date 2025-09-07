'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import EpisodeSection from './EpisodeSection';
import CommentPostForm from './CommentPostForm';
import CommentHeader from './CommentHeader';
import CommentsBoard from '../CommentsBoard';
import Comment from '../Comment';
import Reply from '../Reply';
import OpenOrFoldReplies from '../OpenOrFoldReplies';
import SortingMenu from '../SortingMenu';
import { SortOption } from '../SortingMenu';
import { CommentDto, ReplyDto } from '../../types/api';
import { getBusinessQuarter, calculateBusinessWeekNumber, getQuarterInKorean } from '../../lib/quarterUtils';
import { 
  getAnimeComments, 
  createComment, 
  deleteComment, 
  getReplies, 
  createReply, 
  deleteReply,
  CommentRequestDto,
  ReplyRequestDto,
  AnimeCommentSliceDto,
  ReplySliceDto
} from '../../api/comments';

// API 응답 타입 정의 (백엔드 EpisodeDto와 일치)
interface EpisodeDto {
  episodeNumber: number;
  isBreak: boolean;
  scheduledAt: string; // ISO 8601 형식 (LocalDateTime)
  isRescheduled: boolean;
  nextEpScheduledAt?: string; // ISO 8601 형식 (LocalDateTime)
}

interface AnimeInfoDto {
  medium: string;
  status: string;
  totalEpisodes: number;
  premiereDateTime: string;
  titleKor: string;
  titleOrigin?: string;
  dayOfWeek?: string;
  airTime?: string;
  corp?: string;
  director?: string;
  genre?: string;
  author?: string;
  minAge?: number;
  officalSite?: Record<string, string>;
  mainImageUrl?: string;
  mainThumbnailUrl?: string;
  seasonDtos?: Array<{
    year: number;
    seasonType: string;
  }>;
  ottDtos?: Array<{
    ottType: string;
    watchUrl: string;
  }>;
}

interface AnimeStatDto {
  debutRank?: number;
  debutDate?: string;
  peakRank?: number;
  peakDate?: string;
  weeksOnTop10?: number;
}

interface AnimeHomeDto {
  animeInfoDto: AnimeInfoDto;
  animeStatDto: AnimeStatDto;
  episodeDtos: EpisodeDto[];
  rackUnitDtos?: any[];
  castPreviews?: any[];
}

// API 응답 래퍼 (실제 백엔드 응답 구조)
interface ApiResponse<T> {
  isSuccess: boolean;
  code: string;
  message: string;
  result: T;
}

interface RightCommentPanelProps {
  animeId?: number;
}

export default function RightCommentPanel({ animeId = 1 }: RightCommentPanelProps) {
  // 상태 관리
  const [animeData, setAnimeData] = useState<AnimeHomeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 댓글 관련 상태
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [totalCommentCount, setTotalCommentCount] = useState(0);
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [activeFilters, setActiveFilters] = useState<number[]>([]); // 활성화된 에피소드 필터들
  const [currentSort, setCurrentSort] = useState<SortOption>('Recent');
  const [replies, setReplies] = useState<{ [commentId: number]: ReplyDto[] }>({});

  // 분기/주차 계산 함수 (올바른 비즈니스 로직 사용)
  const getQuarterAndWeek = (date: Date) => {
    const quarter = getBusinessQuarter(date);
    const weekNumber = calculateBusinessWeekNumber(date);
    
    return { 
      quarter: getQuarterInKorean(quarter), 
      week: `${weekNumber}주차` 
    };
  };

  // 필터 관련 함수들
  const addFilter = (episodeNumber: number) => {
    if (!activeFilters.includes(episodeNumber)) {
      setActiveFilters(prev => {
        const newFilters = [...prev, episodeNumber];
        return newFilters.sort((a, b) => a - b); // 에피소드 번호 오름차순 정렬
      });
    }
  };

  const removeFilter = (episodeNumber: number) => {
    setActiveFilters(prev => prev.filter(num => num !== episodeNumber));
    // 필터가 제거될 때 해당 에피소드의 선택 상태도 해제
    setSelectedEpisodeIds(prev => prev.filter(id => id !== episodeNumber));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    // 모든 필터가 제거될 때 모든 에피소드 선택 상태도 해제
    setSelectedEpisodeIds([]);
  };





  // 댓글 데이터 로딩
  const loadComments = useCallback(async (page: number = 0, reset: boolean = false) => {
    if (!animeId) return;
    
    try {
      setCommentsLoading(true);
      setCommentsError(null);
      
      const sortBy = currentSort === 'Recent' ? 'RECENT' : 'POPULAR';
      const data = await getAnimeComments(
        animeId,
        selectedEpisodeIds.length > 0 ? selectedEpisodeIds : undefined,
        sortBy,
        page,
        10
      );
      
      if (reset) {
        setComments(data.commentDtos);
        setCurrentPage(0);
      } else {
        setComments(prev => [...prev, ...data.commentDtos]);
      }
      
      setHasMoreComments(data.pageInfo.hasNext);
      setTotalCommentCount(data.totalCount || 0);
      setCurrentPage(page);
      
    } catch (err) {
      setCommentsError('댓글을 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to load comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  }, [animeId, currentSort, selectedEpisodeIds]);

  // API 호출 함수
  const fetchAnimeData = useCallback(async (animeId: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // 실제 API 엔드포인트 호출
      const response = await fetch(`/api/v1/animes/${animeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`애니메이션 ID ${animeId}를 찾을 수 없습니다.`);
        } else if (response.status >= 500) {
          throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      
      const apiResponse: ApiResponse<AnimeHomeDto> = await response.json();
      
      // API 응답 구조 확인 및 디버깅
      
      if (apiResponse.isSuccess && apiResponse.result) {
        setAnimeData(apiResponse.result);
      } else {
        // API 응답이 실패했을 때 더 자세한 정보 로깅
        throw new Error(apiResponse.message || '데이터를 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      // 콘솔 에러를 안전하게 처리
      try {
        console.error('API Error:', err);
      } catch (consoleErr) {
        // 콘솔 에러가 발생해도 앱이 중단되지 않도록 처리
      }
      
      // 에러 발생 시 임시 데이터로 폴백
      const fallbackData: AnimeHomeDto = {
        animeInfoDto: {
          medium: "TVA",
          status: "ONGOING",
          totalEpisodes: 12,
          premiereDateTime: new Date().toISOString(),
          titleKor: "샘플 애니메이션"
        },
        animeStatDto: {},
        episodeDtos: Array.from({ length: 12 }, (_, i) => {
          const scheduledAt = new Date();
          scheduledAt.setDate(scheduledAt.getDate() + (i - 5) * 7);
          
          return {
            episodeNumber: i + 1,
            isBreak: false,
            scheduledAt: scheduledAt.toISOString(),
            isRescheduled: false,
            nextEpScheduledAt: undefined
          };
        })
      };
      
      setAnimeData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, []); // useCallback 의존성 배열

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchAnimeData(animeId);
  }, [animeId, fetchAnimeData]);

  // 댓글 데이터 로드
  useEffect(() => {
    loadComments(0, true);
  }, [loadComments]);


  // 필터 핸들러 함수들
  const handleClearFilters = () => {
    setActiveFilters([]);
    setSelectedEpisodeIds([]);
  };

  const handleRemoveFilter = (episodeNumber: number) => {
    setActiveFilters(prev => prev.filter(ep => ep !== episodeNumber));
    setSelectedEpisodeIds(prev => prev.filter(id => id !== episodeNumber));
  };

  // 답글 관련 상태 및 핸들러
  const [activeReplyForm, setActiveReplyForm] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<{ [commentId: number]: boolean }>({});
  
  // 애니 헤더 높이 측정을 위한 ref와 상태
  const commentHeaderRef = useRef<HTMLDivElement>(null);
  const sortingMenuRef = useRef<HTMLDivElement>(null);
  const [commentHeaderHeight, setCommentHeaderHeight] = useState(80); // 기본값을 80px로 설정
  
  // Sticky 상태 관리
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isSortingSticky, setIsSortingSticky] = useState(false);
  const [headerOriginalTop, setHeaderOriginalTop] = useState(0);
  const [sortingOriginalTop, setSortingOriginalTop] = useState(0);
  const [rightPanelLeft, setRightPanelLeft] = useState(0);

  const handleReplyClick = (type: 'comment' | 'reply', id: number) => {
    const formKey = `${type}-${id}`;
    setActiveReplyForm(activeReplyForm === formKey ? null : formKey);
  };

  const handleReplySubmit = async (content: string, commentId: number) => {
    try {
      const request: ReplyRequestDto = {
        commentRequestDto: {
          body: content,
        }
      };
      
      await createReply(commentId, request);
      setActiveReplyForm(null);
      
      // 댓글 목록 새로고침
      loadComments(0, true);
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleReplyCancel = () => {
    setActiveReplyForm(null);
  };

  const handleToggleReplies = (commentId: number) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // 댓글/답글 핸들러 함수들
  const onCommentLike = (commentId: number) => {
    // TODO: 좋아요 API 호출 (아직 백엔드에 구현되지 않음)
  };

  const onCommentDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId);
      // 댓글 목록 새로고침
      loadComments(0, true);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const onReplyLike = (replyId: number) => {
    // TODO: 좋아요 API 호출 (아직 백엔드에 구현되지 않음)
  };

  const onReplyDelete = async (replyId: number) => {
    try {
      await deleteReply(replyId);
      // 댓글 목록 새로고침
      loadComments(0, true);
    } catch (error) {
      console.error('Failed to delete reply:', error);
    }
  };

  // 답글 작성 폼 컴포넌트
  const ReplyForm = () => (
    <div className="w-full h-auto flex flex-col justify-center items-end gap-2.5">
      <div className="w-full h-auto px-[11px] pt-[10px] pb-[14px] bg-[#F8F9FA] flex flex-col justify-center items-end gap-[10px] overflow-hidden">
        <CommentPostForm 
          variant="forReply"
          onSubmit={(content) => {
            const commentId = parseInt(activeReplyForm?.split('-')[1] || '0');
            handleReplySubmit(content, commentId);
          }}
          onImageUpload={(file) => {
            // TODO: 이미지 업로드 처리
          }}
          placeholder="답글을 입력하세요..."
        />
      </div>
    </div>
  );

  // 애니 헤더 높이 측정
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (commentHeaderRef.current) {
        const height = commentHeaderRef.current.offsetHeight;
        setCommentHeaderHeight(height);
      }
    };

    // 초기 높이 측정을 위해 약간의 지연 추가
    const timeoutId = setTimeout(() => {
      updateHeaderHeight();
    }, 0);

    // ResizeObserver로 높이 변화 감지
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    if (commentHeaderRef.current) {
      resizeObserver.observe(commentHeaderRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [activeFilters]); // activeFilters가 변경될 때마다 높이 재측정

  // 컴포넌트 마운트 후 추가로 높이 측정
  useEffect(() => {
    const updateHeight = () => {
      if (commentHeaderRef.current) {
        const height = commentHeaderRef.current.offsetHeight;
        if (height > 0) {
          setCommentHeaderHeight(height);
        }
      }
    };

    // 여러 시점에서 높이 측정
    const timeouts = [
      setTimeout(updateHeight, 100),
      setTimeout(updateHeight, 300),
      setTimeout(updateHeight, 500)
    ];

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // 스크롤 이벤트로 sticky 효과 구현
  useEffect(() => {
    const handleScroll = () => {
      if (!commentHeaderRef.current || !sortingMenuRef.current) return;

      const scrollY = window.scrollY;
      
      // Header sticky 처리
      if (scrollY >= headerOriginalTop - 60) {
        if (!isHeaderSticky) {
          setIsHeaderSticky(true);
        }
      } else {
        if (isHeaderSticky) {
          setIsHeaderSticky(false);
        }
      }

      // Sorting sticky 처리
      if (scrollY >= sortingOriginalTop - 60 - commentHeaderHeight) {
        if (!isSortingSticky) {
          setIsSortingSticky(true);
        }
      } else {
        if (isSortingSticky) {
          setIsSortingSticky(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isHeaderSticky, isSortingSticky, commentHeaderHeight, headerOriginalTop, sortingOriginalTop]);

  // 원래 위치 설정
  useEffect(() => {
    const setOriginalPositions = () => {
      if (commentHeaderRef.current && sortingMenuRef.current) {
        const headerRect = commentHeaderRef.current.getBoundingClientRect();
        const sortingRect = sortingMenuRef.current.getBoundingClientRect();
        
        setHeaderOriginalTop(headerRect.top + window.scrollY);
        setSortingOriginalTop(sortingRect.top + window.scrollY);
        
        // Right panel의 left 위치 계산
        const rightPanelElement = commentHeaderRef.current.closest('.w-\\[610px\\]');
        if (rightPanelElement) {
          const rightPanelRect = rightPanelElement.getBoundingClientRect();
          setRightPanelLeft(rightPanelRect.left);
        }
      }
    };

    // 컴포넌트 마운트 후 위치 설정
    const timeout = setTimeout(setOriginalPositions, 100);
    
    // 윈도우 리사이즈 시에도 위치 재설정
    window.addEventListener('resize', setOriginalPositions);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', setOriginalPositions);
    };
  }, [comments, activeFilters, commentHeaderHeight]);

  // 댓글 데이터 로드 (테스트용)
  useEffect(() => {
    // 테스트용 댓글 데이터
    const testComments: CommentDto[] = [
      {
        status: "NORMAL",
        commentId: 1,
        canDeleteThis: false,
        isLiked: false,
        commentLikeId: 0,
        likeCount: 120,
        authorId: 1,
        nickname: "fever",
        profileImageUrl: "",
        voteCount: 1,
        createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // 25분 전
        attachedImageUrl: undefined,
        body: "무지성으로 잘대해준다는 느낌이 아니고 제대로 본인 노력에 걸맞는 평가 받아가고 본인도 점점 나아가고 하는 느낌이라 이 훈훈한 분위기가 몇배로 맛있게 느껴지는듯 이번화 특히 間 를 절묘하게 잘써서 더 재밋게 본듯",
        replyCount: 2
      },
      {
        status: "NORMAL",
        commentId: 2,
        canDeleteThis: false,
        isLiked: true,
        commentLikeId: 1,
        likeCount: 89,
        authorId: 3,
        nickname: "anime_lover",
        profileImageUrl: "",
        voteCount: 5,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
        attachedImageUrl: undefined,
        body: "이번 에피소드 정말 감동적이었어요. 캐릭터들의 성장이 잘 드러나고 특히 마지막 장면이 인상적이었습니다. 다음 주가 너무 기대돼요!",
        replyCount: 0
      },
      {
        status: "NORMAL",
        commentId: 3,
        canDeleteThis: false,
        isLiked: false,
        commentLikeId: 0,
        likeCount: 45,
        authorId: 4,
        nickname: "otaku_master",
        profileImageUrl: "",
        voteCount: 2,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4시간 전
        attachedImageUrl: undefined,
        body: "작화가 정말 좋네요. 특히 배경과 캐릭터의 조화가 완벽합니다. 이런 퀄리티로 계속 나와주면 좋겠어요.",
        replyCount: 1
      },
      {
        status: "NORMAL",
        commentId: 4,
        canDeleteThis: false,
        isLiked: false,
        commentLikeId: 0,
        likeCount: 67,
        authorId: 5,
        nickname: "weeb_king",
        profileImageUrl: "",
        voteCount: 3,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6시간 전
        attachedImageUrl: undefined,
        body: "스토리 전개가 예상보다 빨라서 좋네요. 원작을 안 읽어봤는데도 이해하기 쉽게 잘 만들어졌어요. 추천합니다!",
        replyCount: 0
      },
      {
        status: "NORMAL",
        commentId: 5,
        canDeleteThis: false,
        isLiked: true,
        commentLikeId: 2,
        likeCount: 156,
        authorId: 6,
        nickname: "manga_reader",
        profileImageUrl: "",
        voteCount: 8,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8시간 전
        attachedImageUrl: undefined,
        body: "원작을 읽어본 입장에서 애니메이션화가 정말 잘 되었네요. 원작의 분위기를 잘 살리면서도 애니메이션만의 매력도 추가되었어요. 특히 음악이 정말 좋습니다.",
        replyCount: 3
      },
      {
        status: "NORMAL",
        commentId: 6,
        canDeleteThis: false,
        isLiked: false,
        commentLikeId: 0,
        likeCount: 23,
        authorId: 7,
        nickname: "casual_watcher",
        profileImageUrl: "",
        voteCount: 1,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12시간 전
        attachedImageUrl: undefined,
        body: "처음 보는 애니인데 재밌네요. 계속 챙겨봐야겠어요.",
        replyCount: 0
      }
    ];

    const testReplies: { [commentId: number]: ReplyDto[] } = {
      1: [
        {
          status: "NORMAL",
          replyId: 1,
          canDeleteThis: true,
          isLiked: false,
          replyLikeId: 0,
          likeCount: 55,
          authorId: 2,
          nickname: "braid",
          profileImageUrl: "",
          voteCount: 12,
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5분 전
          listenerId: 1,
          attachedImageUrl: undefined,
          body: "인정합니다."
        },
        {
          status: "NORMAL",
          replyId: 2,
          canDeleteThis: true,
          isLiked: false,
          replyLikeId: 0,
          likeCount: 17,
          authorId: 2,
          nickname: "braid",
          profileImageUrl: "",
          voteCount: 12,
          createdAt: new Date(Date.now() - 29 * 1000).toISOString(), // 29초 전
          listenerId: 1,
          attachedImageUrl: undefined,
          body: "오랜만인데 되게 편안함. 노아 뭔가 티는 냈는데 시원하게 질러버리네"
        }
      ],
      3: [
        {
          status: "NORMAL",
          replyId: 3,
          canDeleteThis: true,
          isLiked: true,
          replyLikeId: 1,
          likeCount: 12,
          authorId: 8,
          nickname: "art_critic",
          profileImageUrl: "",
          voteCount: 1,
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3시간 전
          listenerId: 3,
          attachedImageUrl: undefined,
          body: "작화팀이 정말 대단해요. 디테일이 놀라워요."
        }
      ],
      5: [
        {
          status: "NORMAL",
          replyId: 4,
          canDeleteThis: true,
          isLiked: false,
          replyLikeId: 0,
          likeCount: 8,
          authorId: 9,
          nickname: "music_fan",
          profileImageUrl: "",
          voteCount: 0,
          createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7시간 전
          listenerId: 5,
          attachedImageUrl: undefined,
          body: "음악이 정말 좋네요. OST 구매하고 싶어요."
        },
        {
          status: "NORMAL",
          replyId: 5,
          canDeleteThis: true,
          isLiked: false,
          replyLikeId: 0,
          likeCount: 15,
          authorId: 10,
          nickname: "book_worm",
          profileImageUrl: "",
          voteCount: 2,
          createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(), // 7시간 30분 전
          listenerId: 5,
          attachedImageUrl: undefined,
          body: "원작도 추천해요. 더 자세한 심리 묘사가 있어서 좋아요."
        },
        {
          status: "NORMAL",
          replyId: 6,
          canDeleteThis: true,
          isLiked: true,
          replyLikeId: 2,
          likeCount: 22,
          authorId: 11,
          nickname: "anime_veteran",
          profileImageUrl: "",
          voteCount: 4,
          createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // 7시간 전
          listenerId: 5,
          attachedImageUrl: undefined,
          body: "이런 퀄리티의 애니메이션이 나오는 게 정말 감사해요. 제작진들 수고하셨어요!"
        }
      ]
    };

    setComments(testComments);
    setReplies(testReplies);
  }, []);


  // 총 에피소드 수 계산
  const totalEpisodes = animeData?.episodeDtos.length || 0;

  // 에피소드 데이터 처리 (각 에피소드의 scheduledAt을 기반으로 분기/주차 계산)
  const processedEpisodes = animeData?.episodeDtos.map(episodeDto => {
    const scheduledAt = new Date(episodeDto.scheduledAt);
    const { quarter, week } = getQuarterAndWeek(scheduledAt);
    
    return {
      id: episodeDto.episodeNumber, // episodeNumber를 id로 사용
      episodeNumber: episodeDto.episodeNumber,
      scheduledAt: episodeDto.scheduledAt,
      quarter,
      week,
      isBreak: episodeDto.isBreak,
      isRescheduled: episodeDto.isRescheduled
    };
  }) || [];


  // 에피소드 클릭 핸들러 (다중 선택 및 필터 추가/제거)
  const handleEpisodeClick = (episodeId: number) => {
    const episode = animeData?.episodeDtos.find(ep => ep.episodeNumber === episodeId);
    
    setSelectedEpisodeIds(prev => {
      if (prev.includes(episodeId)) {
        // 이미 선택된 에피소드를 클릭하면 선택 해제 및 필터 제거
        if (episode) {
          setActiveFilters(current => current.filter(num => num !== episode.episodeNumber));
        }
        return prev.filter(id => id !== episodeId);
      } else {
        // 새로운 에피소드 선택 (기존 선택 유지) 및 필터 추가
        if (episode) {
          setActiveFilters(current => {
            if (!current.includes(episode.episodeNumber)) {
              const newFilters = [...current, episode.episodeNumber];
              return newFilters.sort((a, b) => a - b); // 에피소드 번호 오름차순 정렬
            }
            return current;
          });
        }
        return [...prev, episodeId];
      }
    });
  };


  // 로딩 상태
  if (loading) {
    return (
      <div className="h-[2426px] pt-7 bg-white border-l border-r border-gray-300 inline-flex flex-col justify-start items-center gap-6">
        <div className="size- flex flex-col justify-start items-center gap-2.5">
          <div className="w-full h-5 px-6 inline-flex justify-start items-center gap-3.5">
            <div className="text-center justify-start text-black text-xl font-semibold font-['Pretendard'] leading-snug">에피소드 공개</div>
            <div className="text-center justify-start"><span className="text-black text-base font-semibold font-['Pretendard'] leading-snug">총 </span><span className="text-rose-800 text-base font-semibold font-['Pretendard'] leading-snug">0</span><span className="text-black text-base font-semibold font-['Pretendard'] leading-snug"> 화</span></div>
          </div>
          <div className="size- py-3 inline-flex justify-center items-center">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="h-[2426px] pt-7 bg-white border-l border-r border-gray-300 inline-flex flex-col justify-start items-center gap-6">
        <div className="size- flex flex-col justify-start items-center gap-2.5">
          <div className="w-full h-5 px-6 inline-flex justify-start items-center gap-3.5">
            <div className="text-center justify-start text-black text-xl font-semibold font-['Pretendard'] leading-snug">에피소드 공개</div>
            <div className="text-center justify-start"><span className="text-black text-base font-semibold font-['Pretendard'] leading-snug">총 </span><span className="text-rose-800 text-base font-semibold font-['Pretendard'] leading-snug">{totalEpisodes}</span><span className="text-black text-base font-semibold font-['Pretendard'] leading-snug"> 화</span></div>
          </div>
          <div className="size- py-3 inline-flex justify-center items-center">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[610px] bg-white border-l border-r border-gray-300" style={{ minHeight: 'calc(100vh - 60px)' }}>
      {/* section/episode */}
      <div className="flex justify-center pt-7 pb-1">
        <EpisodeSection 
          episodes={processedEpisodes}
          totalEpisodes={totalEpisodes}
          selectedEpisodeIds={selectedEpisodeIds}
          onEpisodeClick={handleEpisodeClick}
        />
      </div>
      
      {/* Sticky 애니 헤더 */}
      <div 
        ref={commentHeaderRef} 
        className={`z-20 bg-white w-full ${isHeaderSticky ? 'fixed' : ''}`}
        style={isHeaderSticky ? { top: '60px', left: `${rightPanelLeft + 1}px`, width: '608px' } : {}}
      >
        <div className="size- flex flex-col justify-start items-start gap-5">
          <CommentHeader 
            totalComments={totalCommentCount}
            variant={activeFilters.length > 0 ? 'withFilters' : 'default'}
            activeFilters={activeFilters}
            onClearFilters={handleClearFilters}
            onRemoveFilter={handleRemoveFilter}
          />
        </div>
      </div>
      
      {/* 헤더 placeholder */}
      {isHeaderSticky && <div style={{ height: `${commentHeaderHeight}px` }}></div>}
      
      {/* 댓글 작성 폼 */}
      <div className="w-full flex flex-col justify-center items-center gap-2.5 px-0 pt-5">
        <div className="self-stretch px-[11px] pt-[10px] pb-[16px] bg-[#F8F9FA] flex flex-col justify-center items-center gap-[10px] overflow-hidden">
          {/* First Row - Episode Comment Header */}
          <div className="w-[534px] inline-flex justify-end items-center">
            <button className="inline-flex items-center gap-2.5 text-right text-[#ADB5BD] text-xs font-medium font-['Pretendard'] leading-snug hover:underline cursor-pointer">
              <span>에피소드 댓글 남기기</span>
              <Image 
                src="/icons/post-episodeComment.svg" 
                alt="에피소드 댓글" 
                width={6} 
                height={8} 
                className="w-1.5 h-2"
              />
            </button>
          </div>
          
          <CommentPostForm 
            onSubmit={async (comment) => {
              try {
                const request: CommentRequestDto = {
                  body: comment,
                };
                
                await createComment(animeId, request);
                // 댓글 목록 새로고침
                loadComments(0, true);
              } catch (error) {
                console.error('Failed to create comment:', error);
              }
            }}
            onImageUpload={(file) => {
              // TODO: 이미지 업로드 처리
            }}
          />
        </div>
      </div>
      
      {/* Sticky 정렬 메뉴 */}
      <div 
        ref={sortingMenuRef} 
        className={`z-10 bg-white pl-3.5 pt-5 ${isSortingSticky ? 'fixed' : ''}`}
        style={isSortingSticky ? { top: `${60 + commentHeaderHeight}px`, left: `${rightPanelLeft + 1}px`, width: '608px' } : {}}
      >
        <SortingMenu 
          currentSort={currentSort}
          onSortChange={(newSort) => {
            setCurrentSort(newSort);
            // 정렬 변경 시 댓글 다시 로드
            loadComments(0, true);
          }}
        />
      </div>
      
      {/* 정렬 메뉴 placeholder */}
      {isSortingSticky && <div className="pl-3.5 pt-5" style={{ height: '44px' }}></div>}
        
        {/* 댓글 목록 */}
        <div className="w-full bg-white flex flex-col">
          
          {/* 댓글 목록 */}
          <div className="w-full flex flex-col justify-start items-start pb-7">
            {commentsLoading && comments.length === 0 ? (
              <div className="w-full flex justify-center items-center py-8">
                <div className="text-gray-500">댓글을 불러오는 중...</div>
              </div>
            ) : commentsError ? (
              <div className="w-full flex justify-center items-center py-8">
                <div className="text-red-500">{commentsError}</div>
              </div>
            ) : comments.length === 0 ? (
              <div className="w-full flex justify-center items-center py-8">
                <div className="text-gray-500">아직 댓글이 없습니다.</div>
              </div>
            ) : (() => {
              // CommentsBoard의 로직을 여기로 이동
              const createUnifiedList = () => {
                const unifiedList: Array<{
                  type: 'comment';
                  data: CommentDto;
                  commentId: number;
                }> = [];

                comments.forEach(comment => {
                  // 댓글만 추가 (답글은 별도로 렌더링)
                  unifiedList.push({
                    type: 'comment',
                    data: comment,
                    commentId: comment.commentId
                  });
                });

                return unifiedList;
              };

              const unifiedList = createUnifiedList();

              return unifiedList.map((item, index) => {
                const comment = item.data as CommentDto;
                const commentReplies = replies[comment.commentId] || [];

                return (
                  <div key={`comment-${comment.commentId}`} className="w-full">
                    <div className={`w-full mb-1.5 ${index === 0 ? 'pt-7' : ''}`}>
                      <Comment
                        comment={comment}
                        episodeNumber="10화"
                        onLike={onCommentLike}
                        onReply={() => handleReplyClick('comment', comment.commentId)}
                        onDelete={onCommentDelete}
                      />
                    </div>
                    
                    {/* 답글 폼 */}
                    {activeReplyForm === `comment-${comment.commentId}` && (
                      <ReplyForm />
                    )}
                    
                    {/* 답글들 */}
                    {commentReplies.length > 0 && expandedReplies[comment.commentId] && (
                      <div className="w-full mb-1.5 flex flex-col gap-1.5">
                        {commentReplies.map(reply => (
                          <div key={reply.replyId} className="w-full flex flex-col gap-2">
                            <Reply
                              reply={reply}
                              onLike={onReplyLike}
                              onReply={() => handleReplyClick('reply', reply.replyId)}
                              onDelete={onReplyDelete}
                            />
                            
                            {/* 답글의 답글 폼 */}
                            {activeReplyForm === `reply-${reply.replyId}` && (
                              <ReplyForm />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 답글 토글 버튼 */}
                    {commentReplies.length > 0 && (
                      <div className="h-auto mb-6">
                        <OpenOrFoldReplies
                          isOpen={expandedReplies[comment.commentId]}
                          replyCount={commentReplies.length}
                          onToggle={() => handleToggleReplies(comment.commentId)}
                        />
                      </div>
                    )}
                    
                    {/* 답글이 없는 댓글의 경우 추가 간격 */}
                    {commentReplies.length === 0 && (
                      <div className="mb-6"></div>
                    )}
                  </div>
                );
              });
            })()}
            
            {/* 더 보기 버튼 */}
            {hasMoreComments && !commentsLoading && (
              <div className="w-full flex justify-center py-4">
                <button
                  onClick={() => loadComments(currentPage + 1, false)}
                  className="px-4 py-2 text-blue-500 hover:text-blue-700 border border-blue-500 rounded"
                >
                  더 보기
                </button>
              </div>
            )}
            
            {commentsLoading && comments.length > 0 && (
              <div className="w-full flex justify-center py-4">
                <div className="text-gray-500">더 많은 댓글을 불러오는 중...</div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}
