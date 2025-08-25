import Image from 'next/image';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = "애니메이션 이름을 입력하세요" 
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-4 flex-1">
      {/* Search Icon */}
      <div className="w-5 h-5 flex-shrink-0">
        <Image
          src="/icons/voteSection-search.svg"
          alt="Search Icon"
          width={20}
          height={20}
          className="w-full h-full"
        />
      </div>
      
      {/* Search Input */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-10 px-4 py-2 bg-white border-b-2 border-[#990033] outline-none text-sm placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
}
