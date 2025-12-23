import type { ReactNode } from 'react';
import { useId } from 'react';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

interface TooltipBtnProps {
  text?: string;
  content?: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  defaultIsOpen?: boolean;
  isOpen?: boolean;
  variant?: 'dark' | 'light' | 'success' | 'warning' | 'error' | 'info';
}

export default function TooltipBtn({
  text,
  content,
  children,
  placement = 'top',
  className,
  defaultIsOpen,
  isOpen,
  variant = 'dark',
}: TooltipBtnProps) {
  const tooltipId = useId();
  const tooltipContent = content || text || '';

  return (
    <>
      <div
        data-tooltip-id={tooltipId}
        data-tooltip-content={
          typeof tooltipContent === 'string' ? tooltipContent : undefined
        }
      >
        {children}
      </div>
      {tooltipContent && (
        <Tooltip
          id={tooltipId}
          place={placement}
          variant={variant}
          defaultIsOpen={defaultIsOpen}
          isOpen={isOpen}
          className={className}
          style={{
            borderRadius: '8px',
            padding: '6px 12px',
            boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.2)',
            zIndex: 1000,
          }}
          clickable={true}
          opacity={1}
        >
          {typeof tooltipContent === 'string' ? null : tooltipContent}
        </Tooltip>
      )}
    </>
  );
}
