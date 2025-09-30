'use client';

import React, { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
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
import { getThisWeekRecord } from '../../lib/quarterUtils';
import { useAuth } from '../../context/AuthContext';
import { useModal } from '../AppContainer';
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
  isImageModalOpen?: boolean; // 이미지 모달 상태
  animeData?: any | null; // 애니메이션 데이터
  rawAnimeData?: any; // 백엔드 원본 데이터
}

export default function RightCommentPanel({ animeId = 1, isImageModalOpen = false, animeData, rawAnimeData }: RightCommentPanelProps) {
  // 인증 상태 확인
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();
  
  // 상태 관리
  // 애니메이션 데이터는 부모 컴포넌트에서 전달받음
  const [loading, setLoading] = useState(false); // 애니메이션 데이터는 부모에서 전달받으므로 로딩 불필요
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
  
  // 에피소드 페이지 상태를 부모에서 관리
  const [episodeCurrentPage, setEpisodeCurrentPage] = useState(0);
  
  // 현재 분기/주차에 해당하는 페이지로 초기 설정 (NOW_SHOWING 상태일 때만)
  useEffect(() => {
    if (rawAnimeData?.episodeResponseDtos?.length > 0 && rawAnimeData?.animeInfoDto?.status === 'NOW_SHOWING') {
      const currentRecord = getThisWeekRecord(new Date());
      
      const currentEpisodeIndex = rawAnimeData.episodeResponseDtos.findIndex((episode: any) => {
        const episodeDate = new Date(episode.scheduledAt);
        const episodeRecord = getThisWeekRecord(episodeDate);
        
        return episodeRecord.quarterValue === currentRecord.quarterValue && episodeRecord.weekValue === currentRecord.weekValue;
      });
      
      if (currentEpisodeIndex !== -1) {
        const episodesPerPage = 6;
        const targetPage = Math.floor(currentEpisodeIndex / episodesPerPage);
        setEpisodeCurrentPage(targetPage);
      }
    }
  }, [rawAnimeData?.episodeResponseDtos, rawAnimeData?.animeInfoDto?.status]);
  
  // 에피소드 섹션 페이지 상태를 부모에서 관리
  

  // 분기/주차 계산 함수 (올바른 비즈니스 로직 사용)
  const getQuarterAndWeek = (date: Date) => {
    const record = getThisWeekRecord(date);
    
    return { 
      quarter: `${record.quarterValue}분기`, 
      week: `${record.weekValue}주차` 
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






  // 애니메이션 데이터는 부모 컴포넌트에서 전달받음 (API 호출 제거)

  // 댓글 데이터 로드
  useEffect(() => {
    loadComments(0, true);
  }, [loadComments]);

  // 에피소드 필터는 시각적 표시만 하고 댓글 API 호출하지 않음

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

  // 에피소드 필터 변경 시 댓글 재로드 (초기 로딩 제외)
  useEffect(() => {
    if (animeId) {
      // 현재 스크롤 위치 저장
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // 필터 변경 시에는 로딩 상태를 표시하지 않고 댓글만 새로고침
      loadComments(0, true, true, true);
      
      // 댓글 로딩 완료 후 스크롤 위치 복원 (적절한 지연시간)
      setTimeout(() => {
        window.scrollTo({ top: currentScrollTop, behavior: 'auto' });
      }, 200);
    }
  }, [selectedEpisodeIds, animeId]);

  // 에피소드 섹션 초기 페이지 설정 (현재 분기/주차)

  // 필터 핸들러 함수들
  const handleClearFilters = () => {
    setActiveFilters([]);
    setSelectedEpisodeIds([]);
  };

  const handleRemoveFilter = (episodeNumber: number) => {
    setActiveFilters(prev => prev.filter(ep => ep !== episodeNumber));
    
    // episodeNumber에 해당하는 episodeId를 찾아서 selectedEpisodeIds에서 제거
    const episode = rawAnimeData?.episodeResponseDtos?.find((ep: any) => ep.episodeNumber === episodeNumber);
    if (episode) {
      setSelectedEpisodeIds(prev => prev.filter(id => id !== episode.episodeId));
    }
  };

  // 답글 관련 상태 및 핸들러
  const [activeReplyForm, setActiveReplyForm] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<{ [commentId: number]: boolean }>({});
  const [replyFormValues, setReplyFormValues] = useState<{ [key: string]: string }>({});
  const [replyPageInfo, setReplyPageInfo] = useState<{ [commentId: number]: PageInfo }>({});
  
  // Intersection Observer를 위한 ref
  
  // 무한스크롤을 위한 ref
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  // 스티키 상태 관리
  const [isCommentHeaderSticky, setIsCommentHeaderSticky] = useState(false);
  const [isSortingMenuSticky, setIsSortingMenuSticky] = useState(false);
  const [rightPanelLeft, setRightPanelLeft] = useState(200); // RightCommentPanel의 left 위치
  const [commentHeaderHeight, setCommentHeaderHeight] = useState(60); // 댓글 헤더 높이 (기본값)
  
  // 스티키 요소들의 ref
  const commentHeaderRef = useRef<HTMLDivElement>(null);
  const sortingMenuRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  
  
  
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
        openLoginModal();
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
          openLoginModal();
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
    
    // 소팅 메뉴가 스티키되기 시작하는 지점으로 스크롤 (-120 위치)
    setTimeout(() => {
      if (sortingMenuRef.current) {
        const sortingMenuRect = sortingMenuRef.current.getBoundingClientRect();
        const sortingMenuTop = sortingMenuRect.top + window.scrollY;
        const stickyStartPoint = sortingMenuTop - 120; // -120 위치로 고정
        
        window.scrollTo({ 
          top: Math.max(0, stickyStartPoint), 
          behavior: 'auto' 
        });
      }
    }, 200);
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
      if (error instanceof Error && error.message.includes('401')) {
        const shouldLogin = confirm('로그인 후에 좋아요를 남길 수 있습니다. 로그인하시겠습니까?');
        if (shouldLogin) {
          openLoginModal();
        }
      } else {
        alert('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
      }
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




  // RightCommentPanel의 실제 위치 계산
  useEffect(() => {
    const updateRightPanelPosition = () => {
      if (rightPanelRef.current) {
        const rect = rightPanelRef.current.getBoundingClientRect();
        setRightPanelLeft(rect.left);
      }
    };

    // 초기 위치 설정
    updateRightPanelPosition();
    
    // 리사이즈 이벤트 리스너
    window.addEventListener('resize', updateRightPanelPosition);
    
    return () => {
      window.removeEventListener('resize', updateRightPanelPosition);
    };
  }, []);

  // 댓글 헤더 높이 동적 측정
  useEffect(() => {
    const updateCommentHeaderHeight = () => {
      if (commentHeaderRef.current) {
        const height = commentHeaderRef.current.offsetHeight;
        if (height > 0) {
          setCommentHeaderHeight(height);
        }
      }
    };

    // 초기 높이 측정
    updateCommentHeaderHeight();
    
    // 필터 상태 변경 시 높이 재측정
    const timeoutId = setTimeout(updateCommentHeaderHeight, 100);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeFilters]); // 필터 상태 변경 시 높이 재측정

  // 스티키 상태 감지 로직
  useEffect(() => {
    const handleStickyScroll = () => {
      if (!commentHeaderRef.current || !sortingMenuRef.current) return;
      
      const scrollY = window.scrollY;
      
      // 댓글 헤더 스티키 감지
      const commentHeaderRect = commentHeaderRef.current.getBoundingClientRect();
      const commentHeaderTop = commentHeaderRect.top + scrollY;
      const shouldCommentHeaderBeSticky = scrollY >= commentHeaderTop - 60;
      
      if (shouldCommentHeaderBeSticky !== isCommentHeaderSticky) {
        setIsCommentHeaderSticky(shouldCommentHeaderBeSticky);
      }
      
      // 정렬 메뉴 스티키 감지 (댓글 헤더가 스티키일 때만)
      if (shouldCommentHeaderBeSticky) {
        const sortingMenuRect = sortingMenuRef.current.getBoundingClientRect();
        const sortingMenuTop = sortingMenuRect.top + scrollY;
        const shouldSortingMenuBeSticky = scrollY >= sortingMenuTop - 60;
        
        if (shouldSortingMenuBeSticky !== isSortingMenuSticky) {
          setIsSortingMenuSticky(shouldSortingMenuBeSticky);
        }
      } else {
        // 댓글 헤더가 스티키가 아니면 정렬 메뉴도 스티키 해제
        if (isSortingMenuSticky) {
          setIsSortingMenuSticky(false);
        }
      }
    };

    // 초기 체크
    handleStickyScroll();
    
    // 스크롤 이벤트 리스너
    window.addEventListener('scroll', handleStickyScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleStickyScroll);
    };
  }, [isCommentHeaderSticky, isSortingMenuSticky]);

  // 댓글 데이터 로드 - mock 데이터 제거됨


  // 총 에피소드 수 계산 (백엔드 원본 데이터에서 가져옴)
  const totalEpisodes = rawAnimeData?.animeInfoDto?.totalEpisodes || 0;

  // 에피소드 데이터 처리 (백엔드 원본 데이터에서 가져옴) - 메모이제이션
  const processedEpisodes = useMemo(() => {
    return rawAnimeData?.episodeResponseDtos?.map((episodeDto: any) => {
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
  }, [rawAnimeData?.episodeResponseDtos]);

  // 댓글 목록 렌더링을 위한 메모이제이션
  const renderCommentsList = useMemo(() => {
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
          <div className="text-gray-400 text-sm font-normal font-['Pretendard'] text-center mt-2">
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
  }, [comments, replies, expandedReplies, activeReplyForm, replyPageInfo, likeCommentHandler, deleteCommentHandler, handleReplyClick, getCachedReplyForm, handleToggleReplies, handleLoadMoreReplies, onReplyLike, onReplyDelete]);

  // 에피소드 클릭 핸들러 (다중 선택 및 필터 추가/제거)
  const handleEpisodeClick = useCallback((episodeId: number) => {
    const episode = rawAnimeData?.episodeResponseDtos?.find((ep: any) => ep.episodeId === episodeId);
    
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
  }, [rawAnimeData?.episodeResponseDtos]);


  // 로딩 상태 렌더링
  const renderLoadingState = () => (
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

  // 에러 상태 렌더링
  const renderErrorState = () => (
    <div className="bg-white border-l border-r border-gray-300" style={{ minHeight: 'calc(100vh - 60px)', width: '610px' }}>
      {/* 에피소드 섹션 */}
      <div className="flex justify-center pt-7 pb-1" style={{ width: '610px' }}>
        <EpisodeSection 
          episodes={processedEpisodes}
          totalEpisodes={totalEpisodes}
          selectedEpisodeIds={selectedEpisodeIds}
          onEpisodeClick={handleEpisodeClick}
          animeId={animeId || 1}
          currentPage={episodeCurrentPage}
          onPageChange={setEpisodeCurrentPage}
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

  return (
    <>
      {commentsLoading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : (
        <div 
          ref={rightPanelRef}
          className="bg-white border-l border-r border-gray-300" 
          style={{ minHeight: 'calc(100vh - 60px)', width: '610px' }}
        >
          {/* section/episode */}
          <div className="flex justify-center pt-7 pb-1">
            <EpisodeSection 
              episodes={processedEpisodes}
              totalEpisodes={totalEpisodes}
              selectedEpisodeIds={selectedEpisodeIds}
              onEpisodeClick={handleEpisodeClick}
              animeId={animeId}
              currentPage={episodeCurrentPage}
              onPageChange={setEpisodeCurrentPage}
            />
          </div>
      
      {/* 애니 댓글 헤더 - 이미지 모달이 열려있으면 숨김 */}
      {!isImageModalOpen && (
        <div 
          ref={commentHeaderRef}
          className="bg-white w-full"
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
      )}
      
      {/* 댓글 작성 폼 */}

      <div data-comment-form className="w-full flex flex-col justify-center items-center gap-2.5 px-0 pt-5" style={{ width: '610px' }}>
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
                  openLoginModal();
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
                    openLoginModal();
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
      
      {/* 정렬 메뉴 - 이미지 모달이 열려있으면 숨김 */}
      {!isImageModalOpen && (
        <div 
          ref={sortingMenuRef}
          className="bg-white pl-3.5 pt-5"
          style={{ width: '608px' }}
        >
          <SortingMenu 
            currentSort={currentSort}
            onSortChange={handleSortChange}
            onScrollToTop={() => {
              setTimeout(() => {
                // 소팅 메뉴가 스티키되기 시작하는 지점으로 스크롤
                if (sortingMenuRef.current) {
                  const sortingMenuRect = sortingMenuRef.current.getBoundingClientRect();
                  const sortingMenuTop = sortingMenuRect.top + window.scrollY;
                  const stickyStartPoint = sortingMenuTop - 120; // -120 위치로 고정
                  
                  window.scrollTo({ 
                    top: Math.max(0, stickyStartPoint), 
                    behavior: 'auto' 
                  });
                } else {
                  // fallback: 상단으로 스크롤
                  window.scrollTo({ top: 0, behavior: 'auto' });
                }
              }, 100);
            }}
          />
        </div>
      )}
      
      {/* Sticky 댓글 헤더 - 헤더 아래에 고정 */}
      {isCommentHeaderSticky && !isImageModalOpen && (
        <div 
          className="fixed bg-white border-b border-gray-200 z-30 pb-3"
          style={{ 
            top: '60px',
            left: `${rightPanelLeft - 6}px`,
            width: '608px',
            zIndex: 30,
            transition: 'all 0.3s ease-in-out'
          }}
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
      )}
      
      {/* Sticky 정렬 메뉴 - 댓글 헤더 아래에 고정 */}
      {isSortingMenuSticky && !isImageModalOpen && (
        <div 
          className="fixed bg-white border-b border-gray-200 z-30"
          style={{ 
            top: `${60 + commentHeaderHeight}px`, // 헤더 + 댓글 헤더 높이
            left: `${rightPanelLeft - 6}px`,
            width: '608px',
            zIndex: 30,
            transition: 'all 0.3s ease-in-out'
          }}
        >
          <div className="pl-3.5 pt-3">
            <SortingMenu 
              currentSort={currentSort}
              onSortChange={handleSortChange}
              onScrollToTop={() => {
                setTimeout(() => {
                  // 소팅 메뉴가 스티키되기 시작하는 지점으로 스크롤
                  if (sortingMenuRef.current) {
                    const sortingMenuRect = sortingMenuRef.current.getBoundingClientRect();
                    const sortingMenuTop = sortingMenuRect.top + window.scrollY;
                    const stickyStartPoint = sortingMenuTop - 120; // -120 위치로 고정
                    
                    window.scrollTo({ 
                      top: Math.max(0, stickyStartPoint), 
                      behavior: 'auto' 
                    });
                  } else {
                    // fallback: 상단으로 스크롤
                    window.scrollTo({ top: 0, behavior: 'auto' });
                  }
                }, 100);
              }}
            />
          </div>
        </div>
      )}
      
        
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
            ) : renderCommentsList}
            
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
          animeData={animeData} // 애니메이션 데이터 전달
          rawAnimeData={rawAnimeData} // 백엔드 원본 데이터 전달
          onCommentSubmit={handleEpisodeCommentSubmit}
        />
        </div>
      )}
    </>
  );
}
