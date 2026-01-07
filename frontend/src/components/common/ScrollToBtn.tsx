import { ChevronUp } from 'lucide-react';
import React from 'react';

export default function ScrollToBtn() {
  return (
    <div className="fixed right-4 bottom-20 z-[9999] flex flex-col">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="rounded-full bg-gray-400/20 p-2 text-white backdrop-blur-sm transition hover:bg-gray-400/40"
        title="맨 위로 이동"
      >
        <ChevronUp size={24} />
      </button>
    </div>
  );
}
