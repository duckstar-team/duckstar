'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import { FaCheckCircle } from 'react-icons/fa';
import StarRatingSimple from '../StarRatingSimple';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import CommentPostForm from '../anime/CommentPostForm';
import { getCandidate, submitVoteForm } from '@/api/client';
import { CandidateDto } from '@/types/vote';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import StarDetailPopup from '@/components/star/StarDetailPopup';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useModal } from '@/components/AppContainer';
import { ApiResponse } from '@/types/api';

interface VoteModalProps {
  episodeId: number;
  mainThumbnailUrl: string;
  titleKor: string;
  year: number;
  quarter: number;
  week: number;
  hasVoted: boolean;
  onClose: () => void;
  isOpen?: boolean;
}

const isApiErrorResponse = (
  error: unknown
): error is ApiResponse<{ body?: string }> => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (
    'result' in error &&
    'isSuccess' in error &&
    'code' in error &&
    'message' in error
  );
};

export default function VoteModal({
  episodeId,
  mainThumbnailUrl,
  titleKor,
  year,
  quarter,
  week,
  hasVoted,
  onClose,
  isOpen = true,
}: VoteModalProps) {
  const { isAuthenticated } = useAuth();
  const { isLoginModalOpen } = useModal();
  const modalRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const candidateQuery = useQuery<CandidateDto | null>({
    queryKey: ['candidate', episodeId],
    queryFn: async () => {
      const response = await getCandidate(episodeId);
      return response.result ?? null;
    },
    enabled: isOpen && !!episodeId,
    staleTime: 60_000,
    retry: false,
  });

  const candidate = candidateQuery.data;
  const starInfo = candidate?.result?.info ?? null;
  const userStarScore = starInfo?.userStarScore ?? null;
  const hasUserRating = Boolean(userStarScore && userStarScore > 0);

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
    if (!isOpen) {
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
  }, [isOpen, isLoginModalOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
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
  }, [hasSelfVoteRecorded, hasUserRating, isEditing, isOpen]);

  useEffect(() => {
    if (phase !== 'form') return;
    if (hasUserRating && userStarScore) {
      setRating(userStarScore / 2);
    } else {
      setRating(0);
    }
  }, [phase, hasUserRating, userStarScore]);

  const { distribution, participantCount, averageScore } = useMemo(() => {
    const voterCount = candidate?.result?.voterCount ?? 0;
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
  }, [candidate?.result?.voterCount, starInfo]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => submitVoteForm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', episodeId] });
      queryClient.invalidateQueries({
        queryKey: ['candidateList', year, quarter, week],
      });
      setPhase('summary');
      setShowCommentForm(false);
      setIsEditing(false);
      setHasSelfVoteRecorded(true);
    },
    onError: (error) => {
      const apiError = isApiErrorResponse(error) ? error : null;
      const message =
        (apiError as ApiResponse<{ body: string }>)?.result?.body ??
        '투표 정보를 저장하는 데 실패했습니다.';
      setModalError(message);
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
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-white/20 p-4 lg:left-25"
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
                <Link href={`/animes/${candidate?.animeId}`}>
                  <Image
                    src={mainThumbnailUrl}
                    alt={titleKor}
                    width={100}
                    height={100}
                    className="h-48 w-32 rounded-lg object-cover"
                  />
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
