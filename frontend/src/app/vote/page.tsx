import { Suspense } from 'react';
import VotePageContent from '@/components/domain/vote/VotePageContent';

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"></div>
            </div>
            <p className="text-gray-600">페이지를 불러오는 중...</p>
          </div>
        </div>
      }
    >
      <VotePageContent />
    </Suspense>
  );
}
