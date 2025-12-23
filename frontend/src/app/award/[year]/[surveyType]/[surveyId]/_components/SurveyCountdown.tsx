'use client';

import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SurveyCountdownProps {
  startDate: string | Date;
  className?: string;
}

export default function SurveyCountdown({
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
      const diff = target - now;
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
      className={cn('text-lg font-medium text-white @md:text-2xl', className)}
    >
      오픈까지
      <br className={isAwardPage ? 'block' : 'hidden'} />{' '}
      <span className={cn(isAwardPage && 'text-xl @md:text-3xl')}>
        {remaining}
      </span>
    </span>
  );
}
