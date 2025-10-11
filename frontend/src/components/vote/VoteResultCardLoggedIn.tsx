import React, { useState, memo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import VoteCard from "./VoteCard";
import CommentPostForm from "../anime/CommentPostForm";
import EpisodeCommentModal from "../anime/EpisodeCommentModal";
import { VoteHistoryBallotDto } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/components/AppContainer";
import { getCurrentVoteStampImagePath } from "@/utils/voteStampUtils";
import { getAnimeEpisodes } from "@/api/search";
import { createComment } from "@/api/comments";
import { showToast } from "@/components/common/Toast";
import { getThisWeekRecord } from "@/lib/quarterUtils";
import { scrollUtils } from "@/hooks/useAdvancedScrollRestoration";

interface VoteResultCardLoggedInProps {
  ballot: VoteHistoryBallotDto;
  weekDto?: any;
  onCommentSubmit?: (animeId: number, comment: string, images?: File[]) => Promise<void>;
  autoExpand?: boolean;
}

const VoteResultCardLoggedIn = memo(function VoteResultCardLoggedIn({
  ballot,
  weekDto,
  onCommentSubmit,
  autoExpand = false
}: VoteResultCardLoggedInProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [episodeData, setEpisodeData] = useState<any>(null);
  const router = useRouter();
  const { openLoginModal } = useModal();

  // 투표 도장 이미지 프리로딩
  useEffect(() => {
    if (weekDto) {
      const stampImagePath = getCurrentVoteStampImagePath(weekDto, ballot.ballotType === 'BONUS');
      const img = new Image();
      img.src = stampImagePath;
    }
  }, [weekDto, ballot.ballotType]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleCommentSubmit = useCallback(async (comment: string, images?: File[]) => {
    try {
      if (onCommentSubmit) {
        // 부모에서 전달된 핸들러 사용
        await onCommentSubmit(ballot.animeId, comment, images);
      } else {
        // 직접 API 호출
        await createComment(ballot.animeId, {
          body: comment,
          attachedImage: images?.[0]
        });
      }
      // 댓글 작성 성공 시 드롭다운 닫기
      setIsExpanded(false);
      showToast.success('댓글이 성공적으로 작성되었습니다.');
    } catch (error) {
      console.error('댓글 작성 실패:', error);
      showToast.error('댓글 작성에 실패했습니다. 다시 시도해주세요.');
    }
  }, [onCommentSubmit, ballot.animeId]);

  // 에피소드별 댓글 모달 열기
  const handleEpisodeCommentClick = useCallback(async () => {
    try {
      const episodes = await getAnimeEpisodes(ballot.animeId);
      
      // 에피소드 데이터를 EpisodeSection에서 사용할 수 있는 형태로 변환
      const processedEpisodes = episodes.map((episode: any) => {
        const scheduledAt = new Date(episode.scheduledAt);
        const { quarterValue, weekValue } = getThisWeekRecord(scheduledAt);
        
        return {
          id: episode.episodeId,
          episodeId: episode.episodeId,
          episodeNumber: episode.episodeNumber,
          quarter: `${quarterValue}분기`,
          week: `${weekValue}주차`,
          scheduledAt: episode.scheduledAt,
          isBreak: episode.isBreak,
          isRescheduled: episode.isRescheduled
        };
      });
      
      setEpisodeData({
        animeInfoDto: {
          totalEpisodes: ballot.totalEpisodes || 0,
          titleKor: ballot.titleKor,
          mainThumbnailUrl: ballot.mainThumbnailUrl
        },
        episodeResponseDtos: processedEpisodes
      });
      setIsEpisodeModalOpen(true);
    } catch (error) {
      console.error('에피소드 데이터 로드 실패:', error);
      showToast.error('에피소드 정보를 불러오는데 실패했습니다.');
    }
  }, [ballot.animeId, ballot.titleKor, ballot.totalEpisodes, ballot.mainThumbnailUrl]);

  // 에피소드별 댓글 작성
  const handleEpisodeCommentSubmit = useCallback(async (episodeIds: number[], content: string, images?: File[]) => {
    try {
      // 첫 번째 에피소드에 댓글 작성
      await createComment(ballot.animeId, {
        body: content,
        episodeId: episodeIds[0],
        attachedImage: images?.[0]
      });
      setIsEpisodeModalOpen(false);
      showToast.success('에피소드 댓글이 성공적으로 작성되었습니다.');
    } catch (error) {
      console.error('에피소드 댓글 작성 실패:', error);
      showToast.error('에피소드 댓글 작성에 실패했습니다. 다시 시도해주세요.');
      throw error;
    }
  }, [ballot.animeId]);

  const handleCardClick = useCallback(() => {
    // 현재 스크롤 위치 저장
    scrollUtils.saveScrollPosition('vote-result');
    
    // 상세화면에서 돌아왔을 때를 위한 플래그 설정
    sessionStorage.setItem('navigation-type', 'from-vote-result');
    
    router.push(`/animes/${ballot.animeId}`);
  }, [router, ballot.animeId]);

  return (
    <div className="w-full">
      {/* 카드 구조 - 세퍼레이터 기준 두 영역 */}
      <div className="relative bg-white rounded-xl shadow border-2 border-gray-200 overflow-hidden">
        {/* 카드 내용 - 제목 위, 이미지와 투표결과 가로 배치 */}
        <div className="flex flex-col gap-3 p-4 pr-12">
          {/* 제목 + 시즌 - 위쪽 배치, 가운데 정렬 */}
          <div className="flex flex-col items-center text-center">
            <div className="text-lg font-semibold text-gray-900 break-words leading-tight">
              {ballot.titleKor || '제목 없음'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {weekDto ? `${weekDto.year} ${weekDto.season} ${weekDto.week}주차` : ''}
            </div>
          </div>

          {/* 애니 이미지 + 투표 결과 - 가로 배치 */}
          <div className="flex items-center gap-4">
            {/* 썸네일 */}
            <div className="relative w-28 h-36 flex-shrink-0">
              <img
                src={ballot.mainThumbnailUrl}
                alt={ballot.titleKor}
                className="w-full h-full object-cover rounded-md"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/banners/duckstar-logo.svg';
                }}
              />
            </div>

            {/* 기표칸 */}
            <div className="flex-shrink-0 mr-2">
              <div className="relative size-24 rounded-xl border border-gray-300 bg-white flex items-center justify-center overflow-hidden">
                <img
                  src={getCurrentVoteStampImagePath(weekDto, ballot.ballotType === 'BONUS')}
                  alt="투표 완료"
                  className={
                    ballot.ballotType === 'BONUS' 
                      ? "w-[60px] h-[60px] object-cover rounded-xl" 
                      : "w-full h-full object-cover rounded-xl"
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* 세퍼레이터 라인 - 데스크톱에서만 표시 */}
        <div className="absolute top-1/2 right-10 -translate-y-1/2 w-px h-15 bg-gray-200 hidden md:block"></div>

        {/* 왼쪽 영역 - 메인 카드 클릭 */}
        <button
          className="absolute inset-0 cursor-pointer hover:bg-gray-50/30 transition-colors"
          onClick={handleCardClick}
          style={{ 
            clipPath: 'polygon(0 0, calc(100% - 40px) 0, calc(100% - 40px) 100%, 0 100%)'
          }}
        />

        {/* 오른쪽 영역 - 드롭다운 토글 */}
        <button
          className="absolute top-0 right-0 bottom-0 w-10 cursor-pointer hover:bg-gray-100/70 transition-colors flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleExpanded();
          }}
        >
          <motion.svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </button>
      </div>

      {/* 드롭다운 컨텐츠 영역 (완전히 독립적) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden relative z-30"
          >
            <div 
              className="mt-2 bg-gray-50 rounded-lg pl-4 pr-4 pt-4 pb-3 border border-gray-200"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                {/* 에피소드별 댓글 버튼 */}
                <div className="w-full mb-3 flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEpisodeCommentClick();
                    }}
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
                
                {/* 일반 댓글 작성 폼 */}
                <div onClick={(e) => e.stopPropagation()}>
                  <CommentPostForm
                    onSubmit={handleCommentSubmit}
                    onImageUpload={(file) => {
                      // 이미지 업로드 기능 활성화
                    }}
                    placeholder={`${ballot.titleKor}에 대한 댓글 남기기...`}
                    maxLength={500}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 에피소드별 댓글 모달 */}
      <EpisodeCommentModal
        isOpen={isEpisodeModalOpen}
        onClose={() => setIsEpisodeModalOpen(false)}
        animeId={ballot.animeId}
        animeData={episodeData}
        rawAnimeData={episodeData}
        onCommentSubmit={handleEpisodeCommentSubmit}
      />
    </div>
  );
});

export default VoteResultCardLoggedIn;
