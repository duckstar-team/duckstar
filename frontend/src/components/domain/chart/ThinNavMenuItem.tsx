'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

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
      class: 'text-amber-200 ',
    },
    {
      type: 'week',
      state: 'selected',
      class: 'font-bold text-amber-200!',
    },
    {
      type: 'awardItem',
      state: 'selected',
      class: 'text-amber-200! font-bold',
    },
  ],
  defaultVariants: {
    type: 'quarter',
    state: 'default',
  },
});

interface ThinNavMenuItemProps extends VariantProps<typeof menuItemVariants> {
  label: string;
  onClick?: () => void;
}

export default function ThinNavMenuItem({
  type,
  state,
  label,
  onClick,
}: ThinNavMenuItemProps) {
  if (type === 'yearHeader') {
    return (
      <div className={menuItemVariants({ type, state })} onClick={onClick}>
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
      <div className={menuItemVariants({ type, state })} onClick={onClick}>
        <button className="flex h-10 w-full items-center gap-1 rounded-lg pl-3 text-white hover:bg-white/10">
          {/* 드롭다운 아이콘 */}
          <ChevronRight
            className={cn(
              'size-4 transition',
              state === 'unfolded' ? 'rotate-0' : '-rotate-90'
            )}
          />

          {/* 텍스트 */}
          <div className="font-medium">{label}</div>
        </button>
      </div>
    );
  }

  return (
    <div className={menuItemVariants({ type, state })} onClick={onClick}>
      <button
        className={cn(
          'flex h-7 min-w-22 items-center rounded-lg px-2.5 transition hover:bg-white/10',
          // textVariants({ type, state }),
          state === 'selected'
            ? 'bg-amber-200/20 font-bold text-amber-200'
            : 'text-white'
        )}
      >
        {label}
      </button>

      {/* 선택된 상태일 때만 화살표 표시 - 같은 레벨에 배치 */}
      {state === 'selected' && (
        <div className="ml-1 h-4.5 rounded-full border-2 border-amber-300" />
      )}
    </div>
  );
}
