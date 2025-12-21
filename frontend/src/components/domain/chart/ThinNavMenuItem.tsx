'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// 메뉴 아이템 variants
const menuItemVariants = cva('transition-all duration-200', {
  variants: {
    type: {
      yearHeader:
        'self-stretch inline-flex justify-start items-center gap-[1.50px]',
      quarter:
        'self-stretch inline-flex justify-start items-center gap-[1.50px]',
      week: 'pl-7 inline-flex justify-start items-center',
      awardItem: 'pl-7 inline-flex justify-start items-center',
    },
    state: {
      default: '',
      selected: '',
      folded: '',
      unfolded: '',
    },
  },
  compoundVariants: [
    {
      type: 'week',
      state: 'selected',
    },
  ],
  defaultVariants: {
    type: 'quarter',
    state: 'default',
  },
});

// 텍스트 variants
const textVariants = cva('text-base leading-[normal] whitespace-pre', {
  variants: {
    type: {
      yearHeader: 'text-white font-semibold ',
      quarter: 'text-white font-medium',
      week: 'text-white',
      awardItem: 'text-white',
    },
    state: {
      default: '',
      selected: '',
      folded: '',
      unfolded: '',
    },
  },
  compoundVariants: [
    {
      type: 'quarter',
      state: 'selected',
      class: 'text-amber-200 !text-amber-200',
    },
    {
      type: 'week',
      state: 'selected',
      class: 'font-bold text-[#FED783] !text-[#FED783]',
    },
    {
      type: 'awardItem',
      state: 'selected',
      class: 'text-white font-medium',
    },
  ],
  defaultVariants: {
    type: 'quarter',
    state: 'default',
  },
});

// 아이콘 variants
const iconVariants = cva('flex items-center justify-center', {
  variants: {
    type: {
      yearHeader: 'w-0 h-0', // 아이콘 없음
      quarter: 'w-[9px] h-[4.5px]',
      week: 'w-0 h-0', // 아이콘 없음
    },
    state: {
      default: '',
      selected: '',
      folded: '',
      unfolded: '',
    },
  },
  compoundVariants: [
    {
      type: 'quarter',
      state: 'folded',
      class: 'w-[4.5px] h-[9px]', // 접힌 상태에서는 세로 화살표
    },
  ],
  defaultVariants: {
    type: 'quarter',
    state: 'default',
  },
});

interface ThinNavMenuItemProps extends VariantProps<typeof menuItemVariants> {
  label: string;
  icon?: string;
  onClick?: () => void;
  className?: string;
  hideTextOnMobile?: boolean;
}

export default function ThinNavMenuItem({
  type,
  state,
  label,
  icon,
  onClick,
  className,
  hideTextOnMobile = false,
}: ThinNavMenuItemProps) {
  if (type === 'yearHeader') {
    return (
      <div
        className={cn(menuItemVariants({ type, state }), className)}
        onClick={onClick}
      >
        <div className="relative h-10 flex-1">
          <div
            className={cn(
              'absolute top-[10px] left-[11px] justify-center',
              textVariants({ type, state })
            )}
          >
            {label}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'quarter') {
    return (
      <div
        className={cn(menuItemVariants({ type, state }), className)}
        onClick={onClick}
      >
        <div className="relative h-10 flex-1 cursor-pointer rounded-lg transition-colors duration-200 hover:bg-white/10">
          {/* 드롭다운 아이콘 */}
          <div className="absolute top-[13px] left-[12px] flex h-4 w-4 items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={cn(
                'transition-transform duration-300 ease-in-out',
                state === 'unfolded' ? 'rotate-0' : '-rotate-90'
              )}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke={state === 'selected' ? '#FED783' : 'white'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* 텍스트 */}
          <div
            className={cn(
              'absolute top-[10px] left-[31px] justify-center',
              textVariants({ type, state }),
              hideTextOnMobile ? 'hidden md:block' : ''
            )}
          >
            {label}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'week') {
    return (
      <div
        className={cn(menuItemVariants({ type, state }), className)}
        onClick={onClick}
      >
        <div
          className={cn(
            'relative h-7 w-[90px] cursor-pointer rounded-lg transition-colors duration-200 hover:bg-white/10',
            state === 'selected' ? 'bg-amber-200/20' : 'bg-transparent'
          )}
        >
          <div
            className={cn(
              'absolute top-[5px] left-[10px] w-12 justify-center',
              textVariants({ type, state }),
              hideTextOnMobile ? 'hidden md:block' : ''
            )}
          >
            {label}
          </div>
        </div>

        {/* 선택된 상태일 때만 화살표 표시 - 같은 레벨에 배치 */}
        {state === 'selected' && (
          <div className="-ml-[4px] h-0 w-[18px] rotate-90 rounded-full border-[2px] border-[#FED783]"></div>
        )}
      </div>
    );
  }

  if (type === 'awardItem') {
    return (
      <div
        className={cn(menuItemVariants({ type, state }), className)}
        onClick={onClick}
      >
        <div
          className={cn(
            'relative h-8 cursor-pointer rounded-lg px-3 py-1.5 transition-colors duration-200',
            state === 'selected'
              ? 'bg-[#FFB310] hover:bg-[#FFC633]'
              : 'bg-transparent hover:bg-white/10'
          )}
        >
          <div
            className={cn(
              'justify-center',
              textVariants({ type, state }),
              hideTextOnMobile ? 'hidden md:block' : ''
            )}
          >
            {label}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(menuItemVariants({ type, state }), className)}
      onClick={onClick}
    >
      {/* 아이콘 */}
      {icon && (
        <div className={cn(iconVariants({ type, state }))}>
          <img src={icon} alt="" className="h-full w-full object-contain" />
        </div>
      )}

      {/* 텍스트 */}
      <div className={cn(textVariants({ type, state }))}>
        <p>{label}</p>
      </div>
    </div>
  );
}
