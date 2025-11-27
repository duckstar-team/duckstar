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
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import StarRatingSimple from '../StarRatingSimple';
import { useOutsideClick } from '@/hooks/useOutsideClick';
import CommentPostForm from '../anime/CommentPostForm';
import { getCandidate, submitVoteForm } from '@/api/client';
import { CandidateDto } from '@/types/vote';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import StarDetailPopup from '@/components/star/StarDetailPopup';
import { useAuth } from '@/context/AuthContext';

interface VoteModalProps {
  episodeId: number;
  mainThumbnailUrl: string;
  titleKor: string;
  quarter: number;
  week: number;
  hasVoted: boolean;
  onClose: () => void;
  isOpen?: boolean;
}

export default function VoteModal({
  episodeId,
  mainThumbnailUrl,
  titleKor,
  quarter,
  week,
  hasVoted,
  onClose,
  isOpen = true,
}: VoteModalProps) {
  const { isAuthenticated } = useAuth();
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
  const isCandidateLoading = candidateQuery.isLoading;
  const candidateError = candidateQuery.error;
  const starInfo = candidate?.result?.info ?? null;
  const userStarScore = starInfo?.userStarScore ?? null;
  const hasUserRating = Boolean(userStarScore && userStarScore > 0);

  const [phase, setPhase] = useState<'form' | 'summary'>(
    hasVoted ? 'summary' : 'form'
  );
  const [rating, setRating] = useState(0);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasSelfVoteRecorded, setHasSelfVoteRecorded] = useState(hasVoted);

  useEffect(() => {
    setHasSelfVoteRecorded(hasVoted);
  }, [episodeId, hasVoted]);

  useOutsideClick(modalRef, onClose);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
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
  }, [isOpen, onClose]);

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
      // setShowCommentForm(true);
    } else {
      setRating(0);
      // setShowCommentForm(false);
    }
  }, [phase, hasUserRating, userStarScore]);

  const distribution = useMemo(() => {
    if (!starInfo) {
      return Array(10).fill(0);
    }
    return [
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
  }, [starInfo]);

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => submitVoteForm(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate', episodeId] });
      setPhase('summary');
      setShowCommentForm(false);
      setIsEditing(false);
      setHasSelfVoteRecorded(true);
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : '투표 정보를 저장하는 데 실패했습니다.';
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

  const participantCount = candidate?.result?.voterCount ?? 0;
  const averageScore = starInfo?.starAverage ?? 0;
  const formattedDate = candidate?.result?.voteUpdatedAt
    ? format(
        new Date(candidate.result.voteUpdatedAt),
        'yyyy.MM.dd (eee) HH:mm',
        {
          locale: ko,
        }
      )
    : '';
  const userComment = candidate?.result?.body?.trim() ?? '';
  const hasUserComment = Boolean(userComment);
  const commentSummaryText = hasUserComment
    ? userComment
    : '아직 댓글을 작성하지 않았습니다.';
  const currentUserRating =
    hasUserRating && userStarScore ? userStarScore / 2 : 0;
  const commentSubmitLabel = isEditing
    ? '제출'
    : hasVoted
      ? '투표 완료'
      : '작성';

  return (
    <AnimatePresence>
      {isOpen && (
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
                    <FaCheckCircle size={22} className="text-amber-400" />
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
                <Image
                  src={mainThumbnailUrl}
                  alt={titleKor}
                  width={100}
                  height={100}
                  className="h-48 w-32 rounded-2xl object-cover"
                />
                <span className="line-clamp-2 text-left text-sm font-semibold break-keep text-gray-900">
                  {titleKor}
                </span>
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
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {modalError && (
                  <p className="text-sm text-red-600">{modalError}</p>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
