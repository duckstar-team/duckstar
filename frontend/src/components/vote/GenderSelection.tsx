'use client';

import Image from 'next/image';

// Types
interface GenderSelectionProps {
  selectedGender: 'male' | 'female' | null;
  onGenderSelect: (gender: 'male' | 'female') => void;
  onBackClick: () => void;
  onSubmitClick: () => void;
}

interface GenderToggleProps {
  gender: 'male' | 'female';
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant: 'back' | 'submit';
  children: React.ReactNode;
}

type GenderOption = {
  value: 'male' | 'female';
  label: string;
};

// Constants
const GENDER_OPTIONS: GenderOption[] = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
] as const;

const STYLES = {
  container: "flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-end w-full",
  genderTogglesContainer: "flex gap-3.5 sm:gap-8 items-center justify-center relative shrink-0 mr-0 lg:mr-4 order-1 sm:order-none self-end sm:self-auto",
  actionButtonsContainer: "flex gap-2 sm:gap-4 order-2 sm:order-none self-end",
  genderToggle: "flex gap-1 items-center justify-start overflow-clip relative shrink-0",
  genderLabel: "flex flex-col font-['Pretendard'] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-lg sm:text-[24px] text-nowrap",
  genderButton: "block cursor-pointer overflow-visible relative shrink-0 size-5 sm:size-[22px]",
  actionButton: "box-border flex gap-2 items-start justify-start pl-2 pr-2.5 sm:pl-2.5 sm:pr-3 py-2 sm:py-2.5 relative rounded-lg shrink-0 font-['Pretendard'] font-bold text-[#ffffff] text-sm sm:text-[16px] text-nowrap",
  actionButtonText: "flex flex-col justify-center leading-[0] not-italic relative shrink-0",
} as const;

const BUTTON_VARIANTS = {
  back: "bg-gradient-to-r from-[#adb5bd] to-[#868e96] cursor-pointer",
  submit: {
    enabled: "bg-gradient-to-r from-[#cb285e] to-[#9c1f49] cursor-pointer",
    disabled: "bg-gradient-to-r from-[#adb5bd] to-[#868e96] opacity-80 cursor-default"
  }
} as const;

// Utility functions
const getActionButtonVariantClass = (variant: 'back' | 'submit', disabled: boolean): string => {
  if (variant === 'back') return BUTTON_VARIANTS.back;
  return disabled ? BUTTON_VARIANTS.submit.disabled : BUTTON_VARIANTS.submit.enabled;
};

const getGenderToggleImage = (isSelected: boolean): string => {
  return isSelected ? "/icons/voteSection-selected.svg" : "/icons/voteSection-default.svg";
};

// Components
const GenderToggle: React.FC<GenderToggleProps> = ({ 
  gender, 
  label, 
  isSelected, 
  onSelect 
}) => (
  <div className={STYLES.genderToggle}>
    <div className={STYLES.genderLabel}>
      <p className="leading-[normal] whitespace-pre">{label}</p>
    </div>
    <button 
      className={STYLES.genderButton}
      onClick={onSelect}
    >
      <Image
        src={getGenderToggleImage(isSelected)}
        alt={`${label} ${isSelected ? 'Selected' : 'Default'}`}
        width={22}
        height={22}
        className="w-full h-full"
      />
    </button>
  </div>
);

const ActionButton: React.FC<ActionButtonProps> = ({ 
  onClick, 
  disabled = false, 
  variant, 
  children 
}) => {
  const variantClass = getActionButtonVariantClass(variant, disabled);

  return (
    <button
      className={`${STYLES.actionButton} ${variantClass}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className={STYLES.actionButtonText}>
        <p className="leading-[normal] whitespace-pre">{children}</p>
      </div>
    </button>
  );
};

const GenderToggles = ({ 
  selectedGender, 
  onGenderSelect 
}: {
  selectedGender: 'male' | 'female' | null;
  onGenderSelect: (gender: 'male' | 'female') => void;
}) => (
  <div className={STYLES.genderTogglesContainer}>
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
);

const ActionButtons = ({ 
  onBackClick, 
  onSubmitClick, 
  selectedGender 
}: {
  onBackClick: () => void;
  onSubmitClick: () => void;
  selectedGender: 'male' | 'female' | null;
}) => (
  <div className={STYLES.actionButtonsContainer}>
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

// Main component
export default function GenderSelection({
  selectedGender,
  onGenderSelect,
  onBackClick,
  onSubmitClick
}: GenderSelectionProps) {
  return (
    <div className={STYLES.container}>
      <GenderToggles
        selectedGender={selectedGender}
        onGenderSelect={onGenderSelect}
      />
      <ActionButtons
        onBackClick={onBackClick}
        onSubmitClick={onSubmitClick}
        selectedGender={selectedGender}
      />
    </div>
  );
}

