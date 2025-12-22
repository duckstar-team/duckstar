import { MemberAgeGroup, MemberGender } from '@/types';
import VoteButton from './VoteButton';
import { cn } from '@/lib/utils';

interface GenderSelectionProps {
  genderSelectionStep: 'gender' | 'age' | null;
  selectedGender: MemberGender | null;
  selectedAgeGroup: MemberAgeGroup | null;
  setSelectedGender: (gender: MemberGender) => void;
  setSelectedAgeGroup: (ageGroup: MemberAgeGroup) => void;
  onBackClick: () => void;
  onNextClick?: () => void;
  onSubmitClick: () => void;
  isSubmitting?: boolean;
  isRevoteMode?: boolean;
}

type GenderOption = {
  value: MemberGender;
  label: string;
};

type AgeGroupOption = {
  value: MemberAgeGroup;
  label: string;
};

// Constants
const GENDER_OPTIONS: GenderOption[] = [
  { value: MemberGender.Male, label: '남성' },
  { value: MemberGender.Female, label: '여성' },
] as const;

const AGE_GROUP_OPTIONS: AgeGroupOption[] = [
  { value: MemberAgeGroup.Under14, label: '14세 이하' },
  { value: MemberAgeGroup.Age15_19, label: '15-19세' },
  { value: MemberAgeGroup.Age20_24, label: '20-24세' },
  { value: MemberAgeGroup.Age25_29, label: '25-29세' },
  { value: MemberAgeGroup.Age30_34, label: '30-34세' },
  { value: MemberAgeGroup.Over35, label: '35세 이상' },
] as const;

// Main component
export default function GenderSelection({
  genderSelectionStep,
  selectedGender,
  selectedAgeGroup,
  setSelectedGender,
  setSelectedAgeGroup,
  onBackClick,
  onNextClick,
  onSubmitClick,
  isSubmitting = false,
  isRevoteMode = false,
}: GenderSelectionProps) {
  const showGender = genderSelectionStep === 'gender';
  const showAge = genderSelectionStep === 'age';

  return (
    <div className="flex items-center justify-between gap-8">
      {/* Gender Selection */}
      {showGender && (
        <div className="mr-4 flex items-center justify-center gap-4">
          {GENDER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              className="flex items-center gap-2 text-sm font-medium"
              onClick={() => setSelectedGender(value)}
            >
              <span
                className={cn(
                  'relative flex items-center gap-3 rounded-full p-0.5 ring-[1.5px]',
                  selectedGender === value
                    ? 'ring-amber-300'
                    : 'ring-zinc-300/80'
                )}
              >
                <span
                  className={cn(
                    'size-2.5 rounded-full',
                    selectedGender === value && 'bg-amber-400'
                  )}
                />
              </span>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Age Group Selection */}
      {showAge && (
        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-x-4 gap-y-2">
            {AGE_GROUP_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                className="flex items-center gap-2 text-sm font-medium"
                onClick={() => setSelectedAgeGroup(value)}
              >
                <span
                  className={cn(
                    'relative flex items-center gap-3 rounded-full p-0.5 ring-[1.5px]',
                    selectedAgeGroup === value
                      ? 'ring-amber-300'
                      : 'ring-zinc-300/80'
                  )}
                >
                  <span
                    className={cn(
                      'size-2.5 rounded-full',
                      selectedAgeGroup === value && 'bg-amber-400'
                    )}
                  />
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <VoteButton type="back" onClick={onBackClick} disabled={isSubmitting} />

        {/* Next 버튼은 gender 단계에서만 표시 */}
        {showGender && onNextClick && (
          <VoteButton
            type="next"
            onClick={onNextClick}
            disabled={!selectedGender || isSubmitting}
          />
        )}

        {/* 제출 버튼은 age 단계에서만 표시 */}
        {showAge && (
          <VoteButton
            type="submit"
            onClick={onSubmitClick}
            disabled={!selectedGender || !selectedAgeGroup || isSubmitting}
            isSubmitting={isSubmitting}
            isRevoteMode={isRevoteMode}
          />
        )}
      </div>
    </div>
  );
}
