'use client';

import { cn } from '@/lib';
import { SurveyStatus } from '@/types/enums';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SurveyCountdownProps {
  text?: string;
  type?: SurveyStatus;
  startDate: string | Date;
  className?: string;
}

export default function SurveyCountdown({
  text = '오픈까지',
  type = SurveyStatus.NotYet,
  startDate,
  className,
}: SurveyCountdownProps) {
  const [remaining, setRemaining] = useState<string>('');
  const pathname = usePathname();
  const isAwardPage = pathname === '/award';

  useEffect(() => {
    const target =
      startDate instanceof Date
        ? startDate.getTime()
        : new Date(startDate).getTime();

    const update = () => {
      const now = Date.now();
      const diff =
        type === SurveyStatus.Closed
          ? target + 18 * 3600 * 1000 - now
          : target - now;
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      const dayText = days > 0 ? `${days}일 ` : '';
      const timeText = `${hours.toString().padStart(2, '0')}시간 ${minutes
        .toString()
        .padStart(2, '0')}분 ${seconds.toString().padStart(2, '0')}초`;

      setRemaining(`${dayText}${timeText}`);
    };

    update();
    const timerId = setInterval(update, 1000);

    return () => clearInterval(timerId);
  }, [startDate]);

  return (
    <span
      className={cn('text-xl font-medium text-white transition', className)}
    >
      {text}
      <br className={isAwardPage ? 'block' : 'hidden'} />{' '}
      <span className={cn('transition', isAwardPage && 'text-2xl')}>
        {remaining}
      </span>
    </span>
  );
}
