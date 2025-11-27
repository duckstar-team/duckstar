import { Suspense } from 'react';
import VotePageContent from '@/components/vote/VotePageContent';

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500"></div>
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
