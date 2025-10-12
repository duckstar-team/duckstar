'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// 메뉴 아이템 variants
const menuItemVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      type: {
        yearHeader: "self-stretch inline-flex justify-start items-center gap-[1.50px]",
        quarter: "self-stretch inline-flex justify-start items-center gap-[1.50px]",
        week: "pl-7 inline-flex justify-start items-center",
      },
      state: {
        default: "",
        selected: "",
        folded: "",
        unfolded: "",
      },
    },
    compoundVariants: [
      {
        type: "week",
        state: "selected"
      },
    ],
    defaultVariants: {
      type: "quarter",
      state: "default",
    },
  }
);

// 텍스트 variants
const textVariants = cva(
  "text-base leading-[normal] whitespace-pre",
  {
    variants: {
      type: {
        yearHeader: "text-white font-semibold font-['Pretendard']",
        quarter: "text-white font-medium",
        week: "text-white",
      },
      state: {
        default: "",
        selected: "",
        folded: "",
        unfolded: "",
      },
    },
    compoundVariants: [
      {
        type: "quarter",
        state: "selected",
        class: "text-amber-200 !text-amber-200",
      },
      {
        type: "week",
        state: "selected", 
        class: "font-bold text-[#FED783] !text-[#FED783]",
      },
    ],
    defaultVariants: {
      type: "quarter",
      state: "default",
    },
  }
);

// 아이콘 variants
const iconVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      type: {
        yearHeader: "w-0 h-0", // 아이콘 없음
        quarter: "w-[9px] h-[4.5px]",
        week: "w-0 h-0", // 아이콘 없음
      },
      state: {
        default: "",
        selected: "",
        folded: "",
        unfolded: "",
      },
    },
    compoundVariants: [
      {
        type: "quarter",
        state: "folded",
        class: "w-[4.5px] h-[9px]", // 접힌 상태에서는 세로 화살표
      },
    ],
    defaultVariants: {
      type: "quarter",
      state: "default",
    },
  }
);

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
  hideTextOnMobile = false
}: ThinNavMenuItemProps) {
  if (type === "yearHeader") {
    return (
      <div 
        className={cn(menuItemVariants({ type, state }), className)}
        onClick={onClick}
      >
        <div className="flex-1 h-10 relative">
          <div className={cn(
            "left-[11px] top-[10px] absolute justify-center",
            textVariants({ type, state })
          )}>
            {label}
          </div>
        </div>
      </div>
    );
  }

  if (type === "quarter") {
    return (
      <div 
        className={cn(menuItemVariants({ type, state }), className)}
        onClick={onClick}
      >
        <div className="flex-1 h-10 relative rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer">
          {/* 드롭다운 아이콘 */}
          <div className="w-4 h-4 left-[12px] top-[13px] absolute flex items-center justify-center">
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              fill="none" 
              className={cn(
                "transition-transform duration-300 ease-in-out",
                state === "unfolded" ? "rotate-0" : "-rotate-90"
              )}
            >
              <path 
                d="M4 6L8 10L12 6" 
                stroke={state === "selected" ? "#FED783" : "white"} 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </div>
          
          {/* 텍스트 */}
          <div className={cn(
            "left-[31px] top-[10px] absolute justify-center",
            textVariants({ type, state }),
            hideTextOnMobile ? "hidden md:block" : ""
          )}>
            {label}
          </div>
        </div>
      </div>
    );
  }

  if (type === "week") {
    return (
      <div 
        className={cn(menuItemVariants({ type, state }), className)}
        onClick={onClick}
      >
        <div className={cn(
          "w-[90px] h-7 relative rounded-lg hover:bg-white/10 transition-colors duration-200 cursor-pointer",
          state === "selected" ? "bg-amber-200/20" : "bg-transparent"
        )}>
          <div className={cn(
            "w-12 left-[10px] top-[5px] absolute justify-center",
            textVariants({ type, state }),
            hideTextOnMobile ? "hidden md:block" : ""
          )}>
            {label}
          </div>
        </div>
        
        {/* 선택된 상태일 때만 화살표 표시 - 같은 레벨에 배치 */}
        {state === "selected" && (
          <div className="w-[18px] h-0 rotate-90 rounded-full border-[2px] border-[#FED783] -ml-[4px]"></div>
        )}
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
          <img
            src={icon}
            alt=""
            className="w-full h-full object-contain"
          />
        </div>
      )}
      
      {/* 텍스트 */}
      <div className={cn(textVariants({ type, state }))}>
        <p>{label}</p>
      </div>
    </div>
  );
}
