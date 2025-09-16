'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import EpisodeSection from './EpisodeSection';
import CommentPostForm from './CommentPostForm';
import ReplyForm from './ReplyForm';
import CommentHeader from './CommentHeader';
import CommentsBoard from '../CommentsBoard';
import Comment from '../Comment';
import Reply from '../Reply';
import OpenOrFoldReplies from '../OpenOrFoldReplies';
import SortingMenu from '../SortingMenu';
import { SortOption } from '../SortingMenu';
import { CommentDto, ReplyDto } from '../../api/comments';
import { getBusinessQuarter, calculateBusinessWeekNumber, getQuarterInKorean } from '../../lib/quarterUtils';
import { useAuth } from '../../context/AuthContext';
import { startKakaoLogin } from '../../api/client';
import EpisodeCommentModal from './EpisodeCommentModal';
import { EpisodeDto, AnimeInfoDto, AnimeStatDto, AnimeHomeDto, ApiResponse } from './types';
import { useComments } from '../../hooks/useComments';
import { 
  getReplies, 
  createReply, 
  deleteReply,
  likeReply,
  unlikeReply,
  ReplyRequestDto,
  CommentRequestDto,
  PageInfo
} from '../../api/comments';



interface RightCommentPanelProps {
  animeId?: number;
}

export default function RightCommentPanel({ animeId = 1 }: RightCommentPanelProps) {
  // 인증 상태 확인
  const { isAuthenticated } = useAuth();
  
  // 상태 관리
  const [animeData, setAnimeData] = useState<AnimeHomeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 댓글 관련 상태 (useComments 훅 사용)
  const {
    comments,
    setComments,
    commentsLoading,
    commentsError,
    currentPage,
    setCurrentPage,
    hasMoreComments,
    totalCommentCount,
    loadingMore,
    selectedEpisodeIds,
    setSelectedEpisodeIds,
    currentSort,
    setCurrentSort,
    replies,
    setReplies,
    loadComments,
    createComment: createCommentHandler,
    deleteComment: deleteCommentHandler,
    likeComment: likeCommentHandler
  } = useComments(animeId);
  
  const [activeFilters, setActiveFilters] = useState<number[]>([]); // 활성화된 에피소드 필터들

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
      // 에러 처리
      
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
            episodeId: i + 1, // episodeId 추가
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

  // 무한스크롤을 위한 Intersection Observer
  useEffect(() => {

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          
          if (entry.isIntersecting && hasMoreComments && !loadingMore && !commentsLoading) {
            loadComments(currentPage + 1, false);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    // 약간의 지연을 두고 observer 설정
    const timer = setTimeout(() => {
      if (loadMoreRef.current) {
        observer.observe(loadMoreRef.current);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMoreComments, loadingMore, commentsLoading, currentPage]);

  // 에피소드 필터 변경 시 댓글 재로드
  useEffect(() => {
    if (animeId) {
      loadComments(0, true);
    }
  }, [selectedEpisodeIds, animeId, loadComments]);


  // 필터 핸들러 함수들
  const handleClearFilters = () => {
    setActiveFilters([]);
    setSelectedEpisodeIds([]);
    setCurrentPage(0); // 필터 클리어 시 페이지 초기화
  };

  const handleRemoveFilter = (episodeNumber: number) => {
    setActiveFilters(prev => prev.filter(ep => ep !== episodeNumber));
    
    // episodeNumber에 해당하는 episodeId를 찾아서 selectedEpisodeIds에서 제거
    const episode = animeData?.episodeDtos.find(ep => ep.episodeNumber === episodeNumber);
    if (episode) {
      setSelectedEpisodeIds(prev => prev.filter(id => id !== episode.episodeId));
    }
    
    setCurrentPage(0); // 필터 제거 시 페이지 초기화
  };

  // 답글 관련 상태 및 핸들러
  const [activeReplyForm, setActiveReplyForm] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<{ [commentId: number]: boolean }>({});
  const [replyFormValues, setReplyFormValues] = useState<{ [key: string]: string }>({});
  const [replyPageInfo, setReplyPageInfo] = useState<{ [commentId: number]: PageInfo }>({});
  
  // Intersection Observer를 위한 ref
  const commentHeaderRef = useRef<HTMLDivElement>(null);
  const sortingMenuRef = useRef<HTMLDivElement>(null);
  
  // 무한스크롤을 위한 ref
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // Sticky 상태 관리 (간소화)
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [isSortingSticky, setIsSortingSticky] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(80); // 기본 헤더 높이
  
  // 에피소드 댓글 모달 상태
  const [isEpisodeCommentModalOpen, setIsEpisodeCommentModalOpen] = useState(false);

  const handleReplyClick = (type: 'comment' | 'reply', id: number) => {
    const formKey = `${type}-${id}`;
    setActiveReplyForm(activeReplyForm === formKey ? null : formKey);
  };

  const handleReplySubmit = async (content: string, commentId: number, listenerId?: number, images?: File[]) => {
    
    // 인증 상태 확인
    if (!isAuthenticated) {
      const shouldLogin = confirm('답글을 작성하려면 로그인이 필요합니다. 로그인하시겠습니까?');
      if (shouldLogin) {
        startKakaoLogin();
      }
      return;
    }
    
    try {
      const request: ReplyRequestDto = {
        listenerId: listenerId, // 답글의 답글인 경우 대상 멤버 ID
        commentRequestDto: {
          body: content, // 줄바꿈을 포함한 원본 텍스트
          attachedImage: images && images.length > 0 ? images[0] : undefined, // 첫 번째 이미지만 전송
        }
      };
      
      const result = await createReply(commentId, request);
      
      setActiveReplyForm(null);
      
      // 답글을 자동으로 펼치고 답글 목록 조회
      setExpandedReplies(prev => ({
        ...prev,
        [commentId]: true
      }));
      
      try {
        const replyData = await getReplies(commentId, 0, 10);
        setReplies(prev => ({
          ...prev,
          [commentId]: replyData.replyDtos
        }));
        
        // 페이지 정보 저장
        setReplyPageInfo(prev => ({
          ...prev,
          [commentId]: replyData.pageInfo
        }));
        
        // 답글 개수 업데이트 (replyDtos 길이로 계산)
        if (replyData.replyDtos.length > 0) {
          setComments(prev => prev.map(comment => {
            if (!comment || !comment.commentId) return comment;
            return comment.commentId === commentId 
              ? { ...comment, replyCount: replyData.replyDtos.length }
              : comment;
          }));
        }
        
      } catch (error) {
        // 답글 새로고침 실패 시 무시
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        const shouldReLogin = confirm('로그인이 만료되었습니다. 다시 로그인하시겠습니까?');
        if (shouldReLogin) {
          startKakaoLogin();
        }
      } else {
        alert('답글 작성에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleReplyCancel = () => {
    setActiveReplyForm(null);
  };

  const handleToggleReplies = async (commentId: number) => {
    const isCurrentlyExpanded = expandedReplies[commentId];
    const hasLoadedReplies = replies[commentId] && replies[commentId].length > 0;
    
    if (!isCurrentlyExpanded && !hasLoadedReplies) {
      // 답글을 펼치는 경우 - 답글이 아직 로드되지 않았을 때만 조회
      try {
        const replyData = await getReplies(commentId, 0, 10);
        setReplies(prev => ({
          ...prev,
          [commentId]: replyData.replyDtos
        }));
        
        // 페이지 정보 저장
        setReplyPageInfo(prev => ({
          ...prev,
          [commentId]: replyData.pageInfo
        }));
        
      } catch (error) {
        alert('답글을 불러오는데 실패했습니다.');
        return;
      }
    }
    
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // 답글 더보기 함수
  const handleLoadMoreReplies = async (commentId: number) => {
    try {
      const currentPageInfo = replyPageInfo[commentId];
      const nextPage = currentPageInfo ? currentPageInfo.page + 1 : 0;
      
      const replyData = await getReplies(commentId, nextPage, 10);
      
      // 기존 답글에 새 답글 추가
      setReplies(prev => ({
        ...prev,
        [commentId]: [...(prev[commentId] || []), ...replyData.replyDtos]
      }));
      
      // 페이지 정보 업데이트
      setReplyPageInfo(prev => ({
        ...prev,
        [commentId]: replyData.pageInfo
      }));
    } catch (error) {
      alert('답글을 불러오는데 실패했습니다.');
    }
  };

  // 정렬 변경 핸들러
  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort);
    // 정렬 변경 시 댓글 목록 새로고침
    loadComments(0, true);
  };

  // 에피소드 댓글 제출 핸들러
  const handleEpisodeCommentSubmit = async (episodeIds: number[], content: string, images?: File[]) => {
    try {
      // 에피소드별 댓글 생성 API 호출
      const request: CommentRequestDto = {
        episodeId: episodeIds[0], // 선택된 에피소드 ID (하나만 선택 가능)
        body: content,
        attachedImage: images && images.length > 0 ? images[0] : undefined, // 첫 번째 이미지만 전송
      };
      
      await createCommentHandler(request);
    } catch (error) {
      throw error;
    }
  };

  // 댓글/답글 핸들러 함수들 (useComments 훅의 함수들 사용)


  const onReplyLike = async (replyId: number) => {
    try {
      // 현재 답글의 좋아요 상태 확인
      let currentReply: ReplyDto | undefined;
      let currentLikeId: number | undefined;
      
      Object.values(replies).forEach(replyList => {
        const reply = replyList.find(r => r && r.replyId === replyId);
        if (reply) {
          currentReply = reply;
          currentLikeId = reply.replyLikeId;
        }
      });
      
      if (currentReply?.isLiked && currentLikeId && currentLikeId > 0) {
        // 좋아요 취소
        const result = await unlikeReply(replyId, currentLikeId);
        
        // 답글 목록에서 해당 답글의 좋아요 상태 업데이트
        setReplies(prevReplies => {
          const updatedReplies = { ...prevReplies };
          Object.keys(updatedReplies).forEach(commentId => {
            updatedReplies[parseInt(commentId)] = updatedReplies[parseInt(commentId)].map(reply =>
              reply && reply.replyId === replyId
                ? {
                    ...reply,
                    isLiked: false,
                    likeCount: result.likeCount,
                    replyLikeId: currentLikeId // 좋아요 취소해도 likeId는 유지
                  }
                : reply
            );
          });
          return updatedReplies;
        });
      } else {
        // 좋아요 (기존 likeId가 있으면 재활용)
        const result = await likeReply(replyId, currentLikeId);
        
        // 답글 목록에서 해당 답글의 좋아요 상태 업데이트
        setReplies(prevReplies => {
          const updatedReplies = { ...prevReplies };
          Object.keys(updatedReplies).forEach(commentId => {
            updatedReplies[parseInt(commentId)] = updatedReplies[parseInt(commentId)].map(reply =>
              reply && reply.replyId === replyId
                ? {
                    ...reply,
                    isLiked: true,
                    likeCount: result.likeCount,
                    replyLikeId: result.likeId || currentLikeId || 0
                  }
                : reply
            );
          });
          return updatedReplies;
        });
      }
    } catch (error) {
      alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const onReplyDelete = async (replyId: number, commentId?: number) => {
    const shouldDelete = confirm('답글을 삭제하시겠습니까?');
    if (!shouldDelete) {
      return;
    }
    
    try {
      await deleteReply(replyId);
      
      // 답글 목록 새로고침 (답글이 펼쳐져 있는 경우)
      if (commentId && expandedReplies[commentId]) {
        try {
          const replyData = await getReplies(commentId, 0, 10);
          setReplies(prev => ({
            ...prev,
            [commentId]: replyData.replyDtos
          }));
          
        } catch (error) {
          // 답글 새로고침 실패 시 무시
        }
      }
      
    } catch (error) {
      alert('답글 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // ReplyForm 인스턴스를 useRef로 캐시하여 재생성 방지
  const replyFormCache = useRef<Map<string, React.ReactElement>>(new Map());
  
  // 캐시된 ReplyForm 인스턴스 가져오기 또는 생성
  const getCachedReplyForm = useCallback((commentId: number, listenerId?: number) => {
    const key = `${commentId}-${listenerId || 'main'}`;
    
    if (!replyFormCache.current.has(key)) {
      replyFormCache.current.set(key, 
        <ReplyForm 
          key={key}
          commentId={commentId} 
          listenerId={listenerId} 
          onSubmit={handleReplySubmit}
        />
      );
    }
    
    return replyFormCache.current.get(key);
  }, [handleReplySubmit]);


  // Intersection Observer를 사용한 스티키 상태 감지 (스타일링용)
  useEffect(() => {
    const headerObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // header가 sticky 상태인지 감지 (스타일링용)
          setIsHeaderSticky(!entry.isIntersecting);
        });
      },
      { 
        threshold: 0,
        rootMargin: '-60px 0px 0px 0px' // 상단 60px 여백
      }
    );

    const sortingObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // sorting menu가 sticky 상태인지 감지 (스타일링용)
          setIsSortingSticky(!entry.isIntersecting);
        });
      },
      { 
        threshold: 0,
        rootMargin: `-${60 + headerHeight}px 0px 0px 0px` // 동적 여백 (상단 메뉴 + 헤더 높이)
      }
    );

    // 헤더와 소팅 메뉴 관찰 시작
    if (commentHeaderRef.current) {
      headerObserver.observe(commentHeaderRef.current);
    }
    if (sortingMenuRef.current) {
      sortingObserver.observe(sortingMenuRef.current);
    }

    return () => {
      headerObserver.disconnect();
      sortingObserver.disconnect();
    };
  }, [headerHeight]); // 헤더 높이 변경 시 Observer 재생성

  // 헤더 높이 동적 측정
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (commentHeaderRef.current) {
        const height = commentHeaderRef.current.offsetHeight;
        if (height > 0) {
          setHeaderHeight(height);
        }
      }
    };

    // 초기 높이 측정
    const timeoutId = setTimeout(updateHeaderHeight, 100);

    // ResizeObserver로 높이 변화 감지
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    if (commentHeaderRef.current) {
      resizeObserver.observe(commentHeaderRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [activeFilters]); // 필터 변경 시 높이 재측정

  // 댓글 데이터 로드
  useEffect(() => {
    // 댓글 데이터
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
      id: episodeDto.episodeId, // episodeId를 id로 사용
      episodeId: episodeDto.episodeId,
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
    const episode = animeData?.episodeDtos.find(ep => ep.episodeId === episodeId);
    
    setSelectedEpisodeIds(prev => {
      if (prev.includes(episodeId)) {
        // 이미 선택된 에피소드를 클릭하면 선택 해제 및 필터 제거
        if (episode) {
          setActiveFilters(current => current.filter(num => num !== episode.episodeNumber));
        }
        // 필터 변경 시 페이지 초기화
        setCurrentPage(0);
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
        // 필터 변경 시 페이지 초기화
        setCurrentPage(0);
        return [...prev, episodeId];
      }
    });
  };


  // 로딩 상태 - 실제 컨텐츠와 동일한 구조로 스켈레톤 표시
  if (loading) {
    return (
      <div className="bg-white border-l border-r border-gray-300" style={{ minHeight: 'calc(100vh - 60px)', width: '610px' }}>
        {/* 에피소드 섹션 스켈레톤 */}
        <div className="flex justify-center pt-7 pb-1" style={{ width: '610px' }}>
          <div className="w-[534px] h-[200px] bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
        
        {/* 댓글 섹션 스켈레톤 */}
        <div className="w-full bg-white flex flex-col" style={{ width: '608px' }}>
          <div className="w-full flex flex-col justify-start items-start pb-7">
            <div className="w-full flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-2 text-gray-500">로딩 중...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태 - 실제 컨텐츠와 동일한 구조로 에러 표시
  if (error) {
    return (
      <div className="bg-white border-l border-r border-gray-300" style={{ minHeight: 'calc(100vh - 60px)', width: '610px' }}>
        {/* 에피소드 섹션 */}
        <div className="flex justify-center pt-7 pb-1" style={{ width: '610px' }}>
          <EpisodeSection 
            episodes={processedEpisodes}
            totalEpisodes={totalEpisodes}
            selectedEpisodeIds={selectedEpisodeIds}
            onEpisodeClick={handleEpisodeClick}
          />
        </div>
        
        {/* 에러 메시지 */}
        <div className="w-full bg-white flex flex-col" style={{ width: '610px' }}>
          <div className="w-full flex flex-col justify-start items-start pb-7">
            <div className="w-full flex justify-center items-center py-8">
              <div className="text-red-500">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-l border-r border-gray-300" style={{ minHeight: 'calc(100vh - 60px)', width: '610px' }}>
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
        className="sticky top-[60px] z-20 bg-white w-full"

        style={{ width: '608px' }}
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
      
      {/* 댓글 작성 폼 */}

      <div className="w-full flex flex-col justify-center items-center gap-2.5 px-0 pt-5" style={{ width: '610px' }}>
        <div className="self-stretch px-[11px] pt-[10px] pb-[16px] bg-[#F8F9FA] flex flex-col justify-center items-center gap-[10px] overflow-hidden" style={{ width: '608px' }}>
          {/* First Row - Episode Comment Header */}
          <div className="w-[534px] inline-flex justify-end items-center">
            <button 
              onClick={() => setIsEpisodeCommentModalOpen(true)}
              className="inline-flex items-center gap-2.5 text-right text-[#ADB5BD] text-xs font-medium font-['Pretendard'] leading-snug hover:underline cursor-pointer"
            >
              <span>에피소드 댓글 남기기</span>
              <img 
                src="/icons/post-episodeComment.svg" 
                alt="에피소드 댓글" 
                className="w-1.5 h-2"
              />
            </button>
          </div>
          
          <CommentPostForm 
            key="main-comment-form" // 안정적인 key로 댓글 폼 고정
            onSubmit={async (comment, images) => {
              // 인증 상태 확인
              if (!isAuthenticated) {
                const shouldLogin = confirm('댓글을 작성하려면 로그인이 필요합니다. 로그인하시겠습니까?');
                if (shouldLogin) {
                  startKakaoLogin();
                }
                return;
              }
              
              try {
                const request: CommentRequestDto = {
                  body: comment, // 줄바꿈을 포함한 원본 텍스트
                  attachedImage: images && images.length > 0 ? images[0] : undefined, // 첫 번째 이미지만 전송
                };
                
                await createCommentHandler(request);
              } catch (error) {
                if (error instanceof Error && error.message.includes('401')) {
                  const shouldReLogin = confirm('로그인이 만료되었습니다. 다시 로그인하시겠습니까?');
                  if (shouldReLogin) {
                    startKakaoLogin();
                  }
                } else {
                  alert('댓글 작성에 실패했습니다. 다시 시도해주세요.');
                }
              }
            }}
            onImageUpload={(file) => {
              // 이미지 업로드 기능은 현재 구현되지 않음
            }}
          />
        </div>
      </div>
      
      {/* Sticky 정렬 메뉴 */}
      <div 
        ref={sortingMenuRef} 
        className="sticky z-10 bg-white pl-3.5 pt-5"
        style={{ top: `${60 + headerHeight}px`, width: '608px' }}
      >
        <SortingMenu 
          currentSort={currentSort}
          onSortChange={handleSortChange}
        />
      </div>
      
        
        {/* 댓글 목록 */}
        <div className="w-full bg-white flex flex-col" style={{ width: '608px' }}>
          
          {/* 댓글 목록 */}
          <div className="w-full flex flex-col justify-start items-start pb-7" style={{ width: '608px' }}>
            {commentsLoading && comments.length === 0 ? (
              <div className="w-full flex flex-col items-center py-8">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
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
                  // null 체크 추가
                  if (comment && comment.commentId) {
                    // 댓글만 추가 (답글은 별도로 렌더링)
                    unifiedList.push({
                      type: 'comment',
                      data: comment,
                      commentId: comment.commentId
                    });
                  }
                });

                return unifiedList;
              };

              const unifiedList = createUnifiedList();

              // 댓글이 없는 경우
              if (unifiedList.length === 0) {
                return (
                  <div className="w-full flex flex-col items-center justify-center py-16">
                    <div className="text-gray-400 text-base font-normal font-['Pretendard'] text-center">
                      아직 댓글이 없습니다.
                    </div>
                    <div className="text-gray-300 text-sm font-normal font-['Pretendard'] text-center mt-2">
                      첫 번째 댓글을 작성해보세요!
                    </div>
                  </div>
                );
              }

              return unifiedList.map((item, index) => {
                const comment = item.data as CommentDto;
                const commentReplies = replies[comment.commentId] || [];

                return (
                  <div key={`comment-${comment.commentId}`} className="w-full">
                    <div className={`w-full mb-1.5 ${index === 0 ? 'pt-7' : ''}`}>
                      <Comment
                        comment={comment}
                        onLike={likeCommentHandler}
                        onReply={() => handleReplyClick('comment', comment.commentId)}
                        onDelete={deleteCommentHandler}
                      />
                    </div>
                    
                       {/* 답글 폼 - 캐시된 인스턴스 사용, CSS로 보이기/숨기기 제어 */}
                       <div 
                         className="mb-2" 
                         style={{ display: activeReplyForm === `comment-${comment.commentId}` ? 'block' : 'none' }}
                       >
                         {getCachedReplyForm(comment.commentId)}
                       </div>
                    
                    {/* 답글들 */}
                    {comment.replyCount > 0 && expandedReplies[comment.commentId] && commentReplies.length > 0 && (
                      <div className="w-full mb-1.5 flex flex-col gap-1.5">
                        {commentReplies.map(reply => {
                          return (
                          <div key={reply.replyId} className="w-full flex flex-col gap-2">
                            <Reply
                              reply={reply}
                              onLike={onReplyLike}
                              onReply={() => handleReplyClick('reply', reply.replyId)}
                              onDelete={(replyId) => onReplyDelete(replyId, comment.commentId)}
                            />
                            
                               {/* 답글의 답글 폼 - 캐시된 인스턴스 사용, CSS로 보이기/숨기기 제어 */}
                               <div 
                                 className="mb-5" 
                                 style={{ display: activeReplyForm === `reply-${reply.replyId}` ? 'block' : 'none' }}
                               >
                                 {getCachedReplyForm(comment.commentId, reply.authorId)}
                               </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* 답글 토글 버튼 */}
                    {comment.replyCount > 0 && (
                      <div className="h-auto mb-6">
                        <OpenOrFoldReplies
                          isOpen={expandedReplies[comment.commentId]}
                          replyCount={comment.replyCount}
                          hasMoreReplies={replyPageInfo[comment.commentId]?.hasNext || false}
                          onToggle={() => handleToggleReplies(comment.commentId)}
                          onLoadMore={() => handleLoadMoreReplies(comment.commentId)}
                        />
                      </div>
                    )}
                    
                    {/* 답글이 없는 댓글의 경우 추가 간격 */}
                    {comment.replyCount === 0 && (
                      <div className="mb-6"></div>
                    )}
                  </div>
                );
              });
            })()}
            
            {/* 무한스크롤 트리거 */}
            {hasMoreComments && !commentsLoading && (
              <div 
                ref={loadMoreRef} 
                className="w-full flex justify-center py-4 min-h-[50px] cursor-pointer"
                onClick={() => {
                  if (!loadingMore && !commentsLoading) {
                    loadComments(currentPage + 1, false);
                  }
                }}
              >
                {loadingMore ? (
                  <div className="text-gray-500 text-sm">
                    댓글을 불러오는 중...
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">
                    스크롤하거나 클릭하여 더 많은 댓글 보기
                  </div>
                )}
              </div>
            )}
            
            {commentsLoading && comments.length > 0 && (
              <div className="w-full flex justify-center py-4">
                <div className="text-gray-500">더 많은 댓글을 불러오는 중...</div>
              </div>
            )}
          </div>
        </div>
        
        {/* 에피소드 댓글 모달 */}
        <EpisodeCommentModal
          isOpen={isEpisodeCommentModalOpen}
          onClose={() => setIsEpisodeCommentModalOpen(false)}
          animeId={animeId}
          animeData={animeData || undefined}
          onCommentSubmit={handleEpisodeCommentSubmit}
        />
    </div>
  );
}
