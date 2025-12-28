type VoteButtonVariant = 'back' | 'next' | 'bonus' | 'submit';

interface VoteButtonProps {
  type: VoteButtonVariant;
  onClick: () => void;
  disabled?: boolean;
  showError?: boolean;
  errorMessage?: string;
  isSubmitting?: boolean;
  isRevoteMode?: boolean;
}

const BUTTON_CONFIG = {
  back: {
    gradient: 'bg-gradient-to-r from-slate-400 to-slate-500',
    text: 'BACK',
  },
  next: {
    gradient: 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49]',
    text: 'NEXT',
  },
  bonus: {
    gradient: 'bg-gradient-to-r from-[#ffb310] to-[#ce8e06]',
    text: 'BONUS',
  },
  submit: {
    gradient: 'bg-gradient-to-r from-[#cb285e] to-[#9c1f49]',
    text: '제출하기',
  },
} as const;

export default function VoteButton({
  type,
  onClick,
  disabled = false,
  showError = false,
  errorMessage = '일반 투표를 1개 이상 선택해주세요.',
  isSubmitting = false,
  isRevoteMode = false,
}: VoteButtonProps) {
  const config = BUTTON_CONFIG[type];

  const getButtonContent = () => {
    if (showError) {
      return (
        <img
          src="/icons/button-block.svg"
          alt="Block Icon"
          className="h-4 w-4 sm:h-5 sm:w-5"
        />
      );
    }

    if (isSubmitting) {
      return (
        <>
          <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          <span>제출 중...</span>
        </>
      );
    }

    if (type === 'submit' && isRevoteMode) {
      return '재투표하기';
    }

    return config.text;
  };

  return (
    <button
      data-vote-button
      onClick={onClick}
      disabled={disabled}
      className={`${config.gradient} relative flex h-8 items-center justify-center rounded-md px-2.5 text-center text-sm font-bold whitespace-nowrap text-white transition hover:opacity-80`}
    >
      {getButtonContent()}
      {showError && (
        <div className="text-brand absolute top-full right-0 z-10 mt-2 text-xs font-medium whitespace-nowrap transition-opacity duration-3000 ease-in-out">
          {errorMessage}
        </div>
      )}
    </button>
  );
}
