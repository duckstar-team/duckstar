'use client';

import React, { useCallback } from 'react';
import ReplyPostForm from './ReplyPostForm';

interface ReplyFormProps {
  commentId: number;
  listenerId?: number;
  onSubmit: (content: string, commentId: number, listenerId?: number, images?: File[]) => Promise<void>;
}

const ReplyForm = React.memo(({ commentId, listenerId, onSubmit }: ReplyFormProps) => {
  const handleSubmit = useCallback(async (content: string, images?: File[]) => {
    return await onSubmit(content, commentId, listenerId, images);
  }, [onSubmit, commentId, listenerId]);
  
  return (
    <div className="w-full h-auto flex flex-col justify-center items-end gap-2.5">
      <div className="w-full h-auto px-[11px] pt-[10px] pb-[14px] bg-[#F8F9FA] flex flex-col justify-center items-end gap-[10px] overflow-hidden">
        <ReplyPostForm 
          onSubmit={handleSubmit}
          onImageUpload={(file) => {
            // 이미지 업로드 기능은 현재 구현되지 않음
          }}
          placeholder="답글을 입력하세요..."
          commentId={commentId}
          listenerId={listenerId}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // props가 동일하면 리렌더링 방지
  return prevProps.commentId === nextProps.commentId && 
         prevProps.listenerId === nextProps.listenerId;
});

ReplyForm.displayName = 'ReplyForm';

export default ReplyForm;
