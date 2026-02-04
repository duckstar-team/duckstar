import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  banIp,
  withdrawVotesByWeekAndIp,
  undoWithdrawnSubmissions,
} from '@/api/admin';
import { SubmissionCountDto } from '@/types';
import { Schemas } from '@/types';
import { formatWeekLabel } from '@/lib';
import { REASON_MAX_LENGTH } from '@/features/admin/constants';

type BanIpVariables = {
  id: string;
  ipHash: string;
  enabled: boolean;
  reason: string;
};

type WithdrawVotesVariables = {
  id: string;
  weekId: number;
  ipHash: string;
  reason: string;
};

type UndoWithdrawVariables = {
  id: string;
  logId: number;
  weekId: number;
  ipHash: string;
  reason: string;
};

export function useSubmissionActions() {
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'submissions'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'logs'] });
  };

  const banIpMutation = useMutation({
    mutationFn: ({ ipHash, enabled, reason }: BanIpVariables) =>
      banIp(ipHash, enabled, reason),
    onSuccess: invalidateQueries,
    onError: (error) => {
      console.error('IP 차단 실패:', error);
    },
  });

  const withdrawVotesMutation = useMutation({
    mutationFn: ({ weekId, ipHash, reason }: WithdrawVotesVariables) =>
      withdrawVotesByWeekAndIp(weekId, ipHash, reason),
    onSuccess: invalidateQueries,
    onError: (error) => {
      console.error('표 몰수 실패:', error);
    },
  });

  const undoWithdrawMutation = useMutation({
    mutationFn: ({ logId, weekId, ipHash, reason }: UndoWithdrawVariables) =>
      undoWithdrawnSubmissions(logId, weekId, ipHash, reason),
    onSuccess: invalidateQueries,
    onError: (error) => {
      console.error('표 몰수 되돌리기 실패:', error);
    },
  });

  const isProcessing = (id: string) =>
    (banIpMutation.isPending && banIpMutation.variables?.id === id) ||
    (withdrawVotesMutation.isPending &&
      withdrawVotesMutation.variables?.id === id) ||
    (undoWithdrawMutation.isPending &&
      undoWithdrawMutation.variables?.id === id);

  const handleBanIp = (submission: SubmissionCountDto, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = `${submission.weekId}-${submission.ipHash}`;
    if (banIpMutation.isPending || withdrawVotesMutation.isPending) return;

    const newBanStatus = !submission.isBlocked;
    const action = newBanStatus ? '차단' : '차단 해제';

    if (
      !confirm(
        `정말로 이 IP를 ${action}하시겠습니까?\n주차: ${formatWeekLabel(submission.year, submission.quarter, submission.week)}\nIP: ${submission.ipHash}`
      )
    ) {
      return;
    }

    const reason = prompt(
      `${action} 사유를 입력해주세요 (최대 ${REASON_MAX_LENGTH}자):`,
      ''
    );
    if (reason === null) return;
    if (reason.length > REASON_MAX_LENGTH) {
      alert(`사유는 ${REASON_MAX_LENGTH}자 이하여야 합니다.`);
      return;
    }

    banIpMutation.mutate({
      id,
      ipHash: submission.ipHash,
      enabled: newBanStatus,
      reason,
    });
  };

  const handleWithdrawVotes = (
    submission: SubmissionCountDto,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const id = `${submission.weekId}-${submission.ipHash}`;
    if (banIpMutation.isPending || withdrawVotesMutation.isPending) return;

    if (submission.isAllWithdrawn) {
      alert('이미 모든 표가 몰수되었습니다.');
      return;
    }

    if (!submission.isBlocked) {
      alert('표 몰수는 차단된 IP에만 가능합니다. 먼저 IP를 차단해주세요.');
      return;
    }

    if (
      !confirm(
        `정말로 이 IP의 모든 표를 몰수하시겠습니까?\n주차: ${formatWeekLabel(submission.year, submission.quarter, submission.week)}\nIP: ${submission.ipHash}\n제출 수: ${submission.count}`
      )
    ) {
      return;
    }

    const reason = prompt(
      `표 몰수 사유를 입력해주세요 (최대 ${REASON_MAX_LENGTH}자):`,
      ''
    );
    if (reason === null) return;
    if (reason.length > REASON_MAX_LENGTH) {
      alert(`사유는 ${REASON_MAX_LENGTH}자 이하여야 합니다.`);
      return;
    }

    withdrawVotesMutation.mutate({
      id,
      weekId: submission.weekId,
      ipHash: submission.ipHash,
      reason,
    });
  };

  const handleUndoWithdraw = (log: Schemas['ManagementLogDto']) => {
    if (!log.isUndoable || log.weekId == null || !log.logId) {
      alert('되돌릴 수 없는 작업입니다.');
      return;
    }
    const weekYear = (log as any).weekDto?.year ?? (log as any).year;
    const weekQuarter = (log as any).weekDto?.quarter ?? (log as any).quarter;
    const weekWeek = (log as any).weekDto?.week ?? (log as any).week;
    const weekInfo =
      weekYear != null && weekQuarter != null && weekWeek != null
        ? formatWeekLabel(weekYear, weekQuarter, weekWeek)
        : '알 수 없음';

    if (
      !confirm(
        `정말로 이 표 몰수를 되돌리시겠습니까?\n주차: ${weekInfo}\nIP: ${log.ipHash}`
      )
    ) {
      return;
    }

    const reason = prompt(
      `되돌리기 사유를 입력해주세요 (최대 ${REASON_MAX_LENGTH}자):`,
      ''
    );
    if (reason === null) return;
    if (reason.length > REASON_MAX_LENGTH) {
      alert(`사유는 ${REASON_MAX_LENGTH}자 이하여야 합니다.`);
      return;
    }

    undoWithdrawMutation.mutate({
      id: `${log.logId}-${log.weekId}-${log.ipHash}`,
      logId: log.logId,
      weekId: log.weekId,
      ipHash: log.ipHash,
      reason,
    });
  };

  return {
    handleBanIp,
    handleWithdrawVotes,
    handleUndoWithdraw,
    isProcessing,
  };
}
