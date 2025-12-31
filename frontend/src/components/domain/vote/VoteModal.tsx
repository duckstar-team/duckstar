'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { FaCheckCircle } from 'react-icons/fa';
import StarRatingSimple from '@/components/domain/star/StarRatingSimple';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import CommentPostForm from '@/components/domain/comment/CommentPostForm';
import { getCandidate, submitVoteForm } from '@/api/vote';
import { CandidateDto } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import StarDetailPopup from '@/components/domain/star/StarDetailPopup';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useModal } from '@/components/layout/AppContainer';
import { useSidebarWidth } from '@/hooks/useSidebarWidth';

interface VoteModalProps {
  episodeId: number;
  mainThumbnailUrl: string;
  titleKor: string;
  year: number;
  quarter: number;
  week: number;
  hasVoted: boolean;
  onClose: () => void;
}

export default function VoteModal({
  episodeId,
  mainThumbnailUrl,
  titleKor,
  year,
  quarter,
  week,
  hasVoted,
  onClose,
}: VoteModalProps) {
  const { isAuthenticated } = useAuth();
  const { isLoginModalOpen, isVoteModalOpen } = useModal();
  const modalRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const candidateQuery = useQuery<CandidateDto | null>({
    queryKey: ['candidate', episodeId],
    queryFn: async () => {
      const response = await getCandidate(episodeId);
      return response.result ?? null;
    },
    enabled: isVoteModalOpen && !!episodeId,
    staleTime: 60_000,
    retry: false,
  });

  const candidate = candidateQuery.data;
  const starInfo = candidate?.result?.info ?? null;
  const userStarScore = starInfo?.userStarScore ?? null;
  const hasUserRating = Boolean(userStarScore && userStarScore > 0);
  const sidebarWidth = useSidebarWidth();

  const [phase, setPhase] = useState<'form' | 'summary'>(
    hasVoted ? 'summary' : 'form'
  );
  const [rating, setRating] = useState(userStarScore ? userStarScore / 2 : 0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSelfVoteRecorded, setHasSelfVoteRecorded] = useState(hasVoted);

  useEffect(() => {
    setHasSelfVoteRecorded(hasVoted);
  }, [episodeId, hasVoted]);

  const handleOutsideClick = useCallback(
    (_event: MouseEvent) => {
      if (isLoginModalOpen) {
        return;
      }
      onClose();
    },
    [isLoginModalOpen, onClose]
  );

  useOutsideClick(modalRef, handleOutsideClick);

  useEffect(() => {
    if (!isVoteModalOpen) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLoginModalOpen) {
          return;
        }
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = originalOverflow;
    };
  }, [isVoteModalOpen, isLoginModalOpen, onClose]);

  useEffect(() => {
    if (!isVoteModalOpen) {
      setModalError(null);
      setShowCommentForm(false);
      setRating(0);
      setIsEditing(false);
      setPhase(hasSelfVoteRecorded || hasUserRating ? 'summary' : 'form');
      return;
    }

    if (isEditing) {
      return;
    }

    if (hasSelfVoteRecorded || hasUserRating) {
      setPhase('summary');
      setShowCommentForm(false);
    } else {
      setPhase('form');
    }
  }, [hasSelfVoteRecorded, hasUserRating, isEditing, isVoteModalOpen]);

  useEffect(() => {
    if (phase !== 'form') return;
    if (hasUserRating && userStarScore) {
      setRating(userStarScore / 2);
    } else {
      setRating(0);
    }
  }, [phase, hasUserRating, userStarScore]);

  // voterCount를 로컬 state로 관리 (즉시 업데이트를 위해)
  const [localVoterCount, setLocalVoterCount] = useState(
    candidate?.result?.voterCount ?? 0
  );

  // candidate가 변경되면 voterCount 동기화
  useEffect(() => {
    if (candidate?.result?.voterCount !== undefined) {
      setLocalVoterCount(candidate.result.voterCount);
    }
  }, [candidate?.result?.voterCount]);

  const { distribution, participantCount, averageScore } = useMemo(() => {
    const voterCount = localVoterCount;
    if (!starInfo) {
      return {
        distribution: Array(10).fill(0),
        participantCount: voterCount,
        averageScore: 0,
      };
    }

    const counts = [
      starInfo.star_0_5 ?? 0,
      starInfo.star_1_0 ?? 0,
      starInfo.star_1_5 ?? 0,
      starInfo.star_2_0 ?? 0,
      starInfo.star_2_5 ?? 0,
      starInfo.star_3_0 ?? 0,
      starInfo.star_3_5 ?? 0,
      starInfo.star_4_0 ?? 0,
      starInfo.star_4_5 ?? 0,
      starInfo.star_5_0 ?? 0,
    ];

    let totalVotes = voterCount;
    let computedAverage = starInfo.starAverage ?? 0;

    if (starInfo.isBlocked && starInfo.userStarScore > 0) {
      totalVotes += 1;
      const idx = starInfo.userStarScore - 1;
      if (idx >= 0 && idx < counts.length) {
        counts[idx] += 1;
      }
      const weights = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const weightedSum = counts.reduce(
        (sum, count, index) => sum + weights[index] * count,
        0
      );
      computedAverage = totalVotes > 0 ? weightedSum / totalVotes : 0;
    }

    const normalized =
      totalVotes > 0
        ? counts.map((count) => count / totalVotes)
        : Array(10).fill(0);

    return {
      distribution: normalized,
      participantCount: totalVotes,
      averageScore: computedAverage,
    };
  }, [localVoterCount, starInfo]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => submitVoteForm(payload),
    onMutate: async () => {
      // 처음 투표하는 경우에만 voterCount +1 (수정 시에는 업데이트 안 함)
      const isFirstVote =
        !starInfo?.userStarScore || starInfo.userStarScore === 0;
      if (isFirstVote) {
        setLocalVoterCount((prev) => prev + 1);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', episodeId] });
      queryClient.invalidateQueries({
        queryKey: ['candidateList', year, quarter, week],
      });
      // starCandidates 쿼리도 무효화하여 실시간 투표 목록 업데이트
      queryClient.invalidateQueries({
        queryKey: ['starCandidates'],
      });
      setPhase('summary');
      setShowCommentForm(false);
      setIsEditing(false);
      setHasSelfVoteRecorded(true);
    },
    onError: () => {
      // 에러 시 optimistic update 롤백 (처음 투표인 경우에만)
      const isFirstVote =
        !starInfo?.userStarScore || starInfo.userStarScore === 0;
      if (isFirstVote) {
        setLocalVoterCount((prev) => Math.max(0, prev - 1));
      }
      setModalError('댓글을 5자 이상 작성해주세요.');
    },
  });

  const handleVoteFormSubmit = useCallback(
    async (commentText: string) => {
      if (rating <= 0) {
        const message = '별점을 선택해주세요.';
        setModalError(message);
        throw new Error(message);
      }
      const trimmedComment = commentText.trim();
      if (!trimmedComment) {
        const message = '댓글을 입력해주세요.';
        setModalError(message);
        throw new Error(message);
      }
      setModalError(null);
      const starScore = Math.max(1, Math.min(10, Math.round(rating * 2)));
      const payload: Record<string, unknown> = {
        episodeId,
        starScore,
        body: trimmedComment,
      };
      if (starInfo?.episodeStarId) {
        payload.episodeStarId = starInfo.episodeStarId;
      }
      await mutation.mutateAsync(payload);
    },
    [episodeId, mutation, rating, starInfo]
  );

  const userComment = candidate?.result?.body?.trim() ?? '';
  const hasUserComment = Boolean(userComment);
  const commentSummaryText = hasUserComment
    ? userComment
    : '아직 댓글을 작성하지 않았습니다.';
  const currentUserRating =
    hasUserRating && userStarScore ? userStarScore / 2 : 0;
  const commentSubmitLabel =
    isEditing && phase === 'form' ? '제출' : hasVoted ? '투표 완료' : '작성';

  return (
    <AnimatePresence>
      {isVoteModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-white/20 p-4"
        >
          <div className="fixed inset-0 bg-black/20" onClick={onClose} />
          <motion.div
            ref={modalRef}
            layout
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative z-60 rounded-lg border border-gray-200 bg-white p-6 pr-8"
            style={{
              marginLeft: sidebarWidth > 0 ? `${sidebarWidth}px` : 0,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <X
              className="absolute top-3 right-2 size-5 cursor-pointer text-gray-300 hover:text-gray-400"
              onClick={onClose}
            />
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                {hasVoted ? (
                  <>
                    <FaCheckCircle size={24} className="text-amber-400" />
                    참여 완료
                  </>
                ) : (
                  '투표 시간 이후 참여'
                )}
              </h2>
              <span className="rounded-full border border-gray-400 px-2 py-0.5 text-xs text-gray-500">
                {quarter}분기 {week}주차 투표
              </span>
            </div>
            <motion.div
              layout
              className="grid grid-cols-[1fr_auto] items-start gap-6 transition-all duration-500 max-md:grid-cols-1"
            >
              <div className="flex h-fit w-full flex-col items-center gap-2 md:w-32">
                <Link
                  href={`/animes/${candidate?.animeId}`}
                  className="relative"
                >
                  <img
                    src={mainThumbnailUrl}
                    alt={titleKor}
                    className="h-48 w-32 rounded-lg object-cover"
                  />
                  {localVoterCount > 0 && phase === 'form' && (
                    <span className="absolute top-1 left-1 rounded-md bg-gray-800 px-2 py-1 text-xs font-semibold text-white">
                      {localVoterCount}명 참여
                    </span>
                  )}
                </Link>
                <Link
                  href={`/animes/${candidate?.animeId}`}
                  className="line-clamp-2 text-left text-sm font-semibold text-gray-900 hover:text-[#990033]"
                >
                  {titleKor}
                </Link>
              </div>
              <motion.div
                layout
                className={`flex h-full flex-col items-center justify-evenly gap-6 transition-all duration-500 ${
                  showCommentForm ? 'min-w-full md:min-w-[400px]' : 'min-w-40'
                }`}
              >
                {phase === 'summary' ? (
                  <div className="flex w-full flex-col gap-4">
                    <div className="rounded-lg bg-black pt-2 pr-2 pb-4 pl-6 text-white">
                      <StarDetailPopup
                        currentRating={currentUserRating}
                        averageRating={averageScore / 2}
                        participantCount={participantCount}
                        distribution={distribution}
                        onEditClick={() => {
                          setModalError(null);
                          setIsEditing(true);
                          setPhase('form');
                          setShowCommentForm(true);
                        }}
                        fullWidth
                        className="bg-transparent p-0"
                      />
                    </div>
                    <CommentPostForm
                      onSubmit={handleVoteFormSubmit}
                      initialValue={commentSummaryText}
                      submitLabel={commentSubmitLabel}
                      disabled={!isAuthenticated}
                      phase="summary"
                      voteUpdatedAt={candidate?.result.voteUpdatedAt}
                    />
                  </div>
                ) : (
                  <div className="flex w-full justify-center">
                    <StarRatingSimple
                      initialRating={rating}
                      onRatingChange={(value) => {
                        setModalError(null);
                        setRating(value);
                        if (value > 0) {
                          setShowCommentForm(true);
                        }
                      }}
                    />
                  </div>
                )}
                <AnimatePresence>
                  {showCommentForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.9 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.9 }}
                      transition={{ duration: 0.5, ease: 'easeInOut' }}
                      className="w-full overflow-hidden"
                    >
                      <CommentPostForm
                        onSubmit={handleVoteFormSubmit}
                        disabled={mutation.status === 'pending'}
                        initialValue={userComment}
                        submitLabel={commentSubmitLabel}
                        placeholder="최소 5자 이상의 후기를 작성하면 투표가 완료됩니다."
                        phase="form"
                      />
                      {modalError && (
                        <p className="mt-2 ml-2 text-sm text-red-600">
                          {modalError}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
