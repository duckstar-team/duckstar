'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CommentPostForm from '@/components/domain/comment/CommentPostForm';
import EpisodeCommentModal from '@/components/domain/comment/EpisodeCommentModal';
import { AnimeBallotDto } from '@/types';
import { getAnimeEpisodes } from '@/api/search';
import { createComment } from '@/api//comment';
import { showToast } from '@/components/common/Toast';
import { getThisWeekRecord } from '@/lib/quarterUtils';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteResultCardProps {
  ballot: AnimeBallotDto;
  onCommentSubmit?: (
    animeId: number,
    comment: string,
    images?: File[]
  ) => Promise<void>;
  autoExpand?: boolean;
}

export default function VoteResultCard({
  ballot,
  onCommentSubmit,
  autoExpand = false,
}: VoteResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isEpisodeModalOpen, setIsEpisodeModalOpen] = useState(false);
  const [episodeData, setEpisodeData] = useState<any>(null);
  const router = useRouter();

  // 투표 도장 이미지 프리로딩
  // useEffect(() => {
  //   if (weekDto) {
  //     const stampImagePath = getCurrentVoteStampImagePath(weekDto, ballot.ballotType === 'BONUS');
  //     const img = new Image();
  //     img.src = stampImagePath;
  //   }
  // }, [weekDto, ballot.ballotType]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleCommentSubmit = useCallback(
    async (comment: string, images?: File[]) => {
      try {
        if (onCommentSubmit) {
          // 부모에서 전달된 핸들러 사용
          await onCommentSubmit(ballot.animeId, comment, images);
        } else {
          // 직접 API 호출
          await createComment(ballot.animeId, {
            body: comment,
            attachedImage: images?.[0],
          });
        }
        // 댓글 작성 성공 시 드롭다운 닫기
        setIsExpanded(false);
        showToast.success('댓글이 성공적으로 작성되었습니다.');
      } catch (error) {
        console.error('댓글 작성 실패:', error);
        showToast.error('댓글 작성에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [onCommentSubmit, ballot.animeId]
  );

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
          isRescheduled: episode.isRescheduled,
        };
      });

      setEpisodeData({
        animeInfoDto: {
          totalEpisodes: ballot.totalEpisodes || 0,
          titleKor: ballot.titleKor,
          mainThumbnailUrl: ballot.mainThumbnailUrl,
        },
        episodeResponseDtos: processedEpisodes,
      });
      setIsEpisodeModalOpen(true);
    } catch (error) {
      console.error('에피소드 데이터 로드 실패:', error);
      showToast.error('에피소드 정보를 불러오는데 실패했습니다.');
    }
  }, [
    ballot.animeId,
    ballot.titleKor,
    ballot.totalEpisodes,
    ballot.mainThumbnailUrl,
  ]);

  // 에피소드별 댓글 작성
  const handleEpisodeCommentSubmit = useCallback(
    async (episodeIds: number[], content: string, images?: File[]) => {
      try {
        // 첫 번째 에피소드에 댓글 작성
        await createComment(ballot.animeId, {
          body: content,
          episodeId: episodeIds[0],
          attachedImage: images?.[0],
        });
        setIsEpisodeModalOpen(false);
        showToast.success('에피소드 댓글이 성공적으로 작성되었습니다.');
      } catch (error) {
        console.error('에피소드 댓글 작성 실패:', error);
        showToast.error(
          '에피소드 댓글 작성에 실패했습니다. 다시 시도해주세요.'
        );
        throw error;
      }
    },
    [ballot.animeId]
  );

  const handleCardClick = useCallback(() => {
    // 현재 스크롤 위치 저장
    // scrollUtils.saveScrollPosition('vote-result');

    // 상세화면에서 돌아왔을 때를 위한 플래그 설정
    sessionStorage.setItem('navigation-type', 'from-vote-result');

    router.push(`/animes/${ballot.animeId}`);
  }, [router, ballot.animeId]);

  return (
    <div className="w-full">
      {/* 카드 구조 - 세퍼레이터 기준 두 영역 */}
      <div className="relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white shadow">
        {/* 카드 내용 - 오른쪽 영역(w-10)을 제외한 나머지 영역 */}
        <div className="flex items-center gap-4 p-4 pr-12">
          {/* 썸네일 */}
          <div className="relative h-36 w-28 flex-shrink-0">
            <img
              src={ballot.mainThumbnailUrl}
              alt={ballot.titleKor}
              className="h-full w-full rounded-md object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/banners/duckstar-logo.svg';
              }}
            />
          </div>

          {/* 제목 + 시즌 */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="text-lg leading-tight font-semibold break-words text-gray-900">
              {ballot.titleKor || '제목 없음'}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {`${ballot.year} ${ballot.quarter}분기 ${ballot.medium}`}
            </div>
          </div>

          {/* 기표칸 */}
          <div className="mr-2 flex-shrink-0">
            <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-white">
              <img
                src={
                  ballot.ballotType === 'BONUS'
                    ? '/voted-bonus-2025-autumn.svg'
                    : '/voted-normal-2025-autumn.svg'
                }
                alt="투표 완료"
                className={
                  ballot.ballotType === 'BONUS'
                    ? 'h-[60px] w-[60px] rounded-xl object-cover'
                    : 'h-full w-full rounded-xl object-cover'
                }
              />
            </div>
          </div>
        </div>

        {/* 세퍼레이터 라인 */}
        <div className="absolute top-1/2 right-10 h-15 w-px -translate-y-1/2 bg-gray-200"></div>

        {/* 왼쪽 영역 - 메인 카드 클릭 */}
        <button
          className="absolute inset-0 cursor-pointer transition-colors hover:bg-gray-50/30"
          onClick={handleCardClick}
          style={{
            clipPath:
              'polygon(0 0, calc(100% - 40px) 0, calc(100% - 40px) 100%, 0 100%)',
          }}
        />

        {/* 오른쪽 영역 - 드롭다운 토글 */}
        <button
          className="absolute top-0 right-0 bottom-0 flex w-10 cursor-pointer items-center justify-center transition-colors hover:bg-gray-100/70"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleExpanded();
          }}
        >
          <ChevronDown
            className={cn(
              'h-5 w-5 text-gray-600 transition',
              isExpanded && 'rotate-180'
            )}
          />
        </button>
      </div>

      {/* 드롭다운 컨텐츠 영역 (완전히 독립적) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative z-30 overflow-hidden"
          >
            <div
              className="mt-2 rounded-lg border border-gray-200 bg-gray-50 pt-4 pr-4 pb-3 pl-4"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                {/* 에피소드별 댓글 버튼 */}
                <div className="mb-3 flex w-full justify-end">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEpisodeCommentClick();
                    }}
                    className="inline-flex cursor-pointer items-center gap-2.5 text-right font-['Pretendard'] text-xs leading-snug font-medium text-[#ADB5BD] hover:underline"
                  >
                    <span>에피소드 댓글 남기기</span>
                    <img
                      src="/icons/post-episodeComment.svg"
                      alt="에피소드 댓글"
                      className="h-2 w-1.5"
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
}
