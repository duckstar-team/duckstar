'use client';

import MedalGrid from './MedalGrid';

interface MedalData {
  id: string;
  type: "Gold" | "Silver" | "Bronze" | "None";
  title?: string;
  image?: string;
  rank?: number;
  year?: number;
  quarter?: number;
  week?: number;
}

interface MedalSectionProps {
  medals: MedalData[];
  className?: string;
}

export default function MedalSection({
  medals,
  className = ""
}: MedalSectionProps) {
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      <MedalGrid medals={medals} />
      <div className="w-12 h-52 inline-flex flex-col justify-center items-center gap-2.5">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
