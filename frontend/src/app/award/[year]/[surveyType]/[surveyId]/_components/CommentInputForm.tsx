'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import ConfirmModal from '@/components/common/ConfirmModal';

interface CommentInputFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  onCancel?: () => void;
  showCancelButton?: boolean;
}

export default function CommentInputForm({
  onSubmit,
  placeholder = '댓글 추가...',
  onCancel,
  showCancelButton = true,
}: CommentInputFormProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);

  const handleCommentFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!user) {
      e.target.blur(); // 포커스를 제거하여 키보드가 올라오지 않도록
      setIsConfirm(true);
    } else {
      setIsCommenting(true);
    }
  };

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    try {
      await onSubmit(comment);
      setComment('');
      setIsCommenting(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    setComment('');
    setIsCommenting(false);
    onCancel?.();
  };

  return (
    <>
      <div className="my-2 flex min-w-0 flex-col gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src={user?.profileImageUrl || '/icons/profile-default.svg'}
            alt={user?.nickname}
            className="aspect-square w-7 shrink-0 rounded-full"
          />
          <input
            type="text"
            placeholder={placeholder}
            className="min-w-0 flex-1 border-b border-gray-300 p-1 text-sm focus:border-black dark:border-zinc-600 dark:focus:border-white"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onFocus={handleCommentFocus}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (comment.trim() && isCommenting) {
                  handleSubmit();
                }
              }
            }}
          />
        </div>
        {isCommenting && (
          <div className="flex w-full justify-end gap-1 text-xs font-medium">
            {showCancelButton && (
              <button
                onClick={handleCancel}
                className="hover:bg-brand-zinc-200 rounded-full px-3 py-2"
              >
                취소
              </button>
            )}
            <button
              disabled={!comment.trim()}
              onClick={handleSubmit}
              className="rounded-full bg-black px-3 py-2 text-white disabled:cursor-not-allowed! disabled:bg-gray-200/80 disabled:text-gray-400 dark:bg-zinc-700 dark:disabled:bg-zinc-800"
            >
              작성
            </button>
          </div>
        )}
      </div>
      {isConfirm && (
        <ConfirmModal
          title="댓글 작성"
          description="댓글을 작성하기 위해서는 로그인이 필요합니다."
          setIsConfirm={setIsConfirm}
        />
      )}
    </>
  );
}
