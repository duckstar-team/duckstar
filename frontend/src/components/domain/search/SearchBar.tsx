'use client';

import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder,
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-4 @max-md:justify-center">
      <Search className="text-brand size-5 stroke-2" />
      <div className="w-2/3 max-w-sm">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || '애니메이션 검색 (원피스, ㅇㅍㅅ, ...)'}
          className="border-brand w-full border-b-2 px-1 py-2 text-sm placeholder-gray-400"
          spellCheck="false"
        />
      </div>
    </div>
  );
}
