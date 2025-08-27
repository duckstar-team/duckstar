'use client';

import Image from 'next/image';

interface GenderSelectionProps {
  selectedGender: 'male' | 'female' | null;
  onGenderSelect: (gender: 'male' | 'female') => void;
  onBackClick: () => void;
  onSubmitClick: () => void;
}

const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
] as const;

const GenderToggle: React.FC<{
  gender: 'male' | 'female';
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ gender, label, isSelected, onSelect }) => (
  <div className="content-stretch flex gap-1 items-center justify-start overflow-clip relative shrink-0">
    <div className="flex flex-col font-['Pretendard:SemiBold',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-[24px] text-nowrap">
      <p className="leading-[normal] whitespace-pre">{label}</p>
    </div>
    <button 
      className="block cursor-pointer overflow-visible relative shrink-0 size-[22px]"
      onClick={onSelect}
    >
      <Image
        src={isSelected ? "/icons/voteSection-selected.svg" : "/icons/voteSection-default.svg"}
        alt={`${label} ${isSelected ? 'Selected' : 'Default'}`}
        width={22}
        height={22}
        className="w-full h-full"
      />
    </button>
  </div>
);

const ActionButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  variant: 'back' | 'submit';
  children: React.ReactNode;
}> = ({ onClick, disabled = false, variant, children }) => {
  const baseClasses = "box-border content-stretch flex gap-2.5 items-start justify-start pl-2.5 pr-3 py-2.5 relative rounded-lg shrink-0 font-['Pretendard',_sans-serif] font-bold text-[#ffffff] text-[16px] text-nowrap";
  
  const variantClasses = variant === 'back' 
    ? "bg-gradient-to-r from-[#adb5bd] to-[#868e96] cursor-pointer"
    : disabled
    ? "bg-gradient-to-r from-[#adb5bd] to-[#868e96] opacity-80 cursor-default"
    : "bg-gradient-to-r from-[#cb285e] to-[#9c1f49] cursor-pointer";

  return (
    <button
      className={`${baseClasses} ${variantClasses}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex flex-col justify-center leading-[0] not-italic relative shrink-0">
        <p className="leading-[normal] whitespace-pre">{children}</p>
      </div>
    </button>
  );
};

export default function GenderSelection({
  selectedGender,
  onGenderSelect,
  onBackClick,
  onSubmitClick
}: GenderSelectionProps) {
  return (
    <div className="flex items-center gap-4 justify-end w-full">
      {/* Gender Selection Toggles */}
      <div className="content-stretch flex gap-8 items-center justify-center relative shrink-0 mr-0 lg:mr-4">
        {GENDER_OPTIONS.map(({ value, label }) => (
          <GenderToggle
            key={value}
            gender={value}
            label={label}
            isSelected={selectedGender === value}
            onSelect={() => onGenderSelect(value)}
          />
        ))}
      </div>
      
      {/* Action Buttons */}
      <ActionButton variant="back" onClick={onBackClick}>
        BACK
      </ActionButton>
      
      <ActionButton 
        variant="submit" 
        onClick={onSubmitClick}
        disabled={!selectedGender}
      >
        제출하기
      </ActionButton>
    </div>
  );
}

