import { cn } from '@/lib';
import { BiSolidRightArrow } from 'react-icons/bi';

interface RankDiffProps {
  property1:
    | 'up-greater-equal-than-5'
    | 'up-less-than-5'
    | 'down-less-than-5'
    | 'down-greater-equal-than-5'
    | 'same-rank'
    | 'new'
    | 'Zero';
  value: string | number | null;
  isTopTen?: boolean;
}

export default function RankDiff({
  property1,
  value,
  isTopTen = false,
}: RankDiffProps) {
  const CONTAINER_CLASS =
    'flex shrink-0 whitespace-nowrap font-medium items-center justify-center gap-0.5';

  if (property1 === 'new') {
    return (
      <div className={CONTAINER_CLASS}>
        <span className={cn('text-xs text-blue-400', isTopTen && 'text-base')}>
          NEW
        </span>
      </div>
    );
  }

  if (property1 === 'Zero') {
    return (
      <div className={CONTAINER_CLASS}>
        <div className="w-3 border-b-[1.5px] bg-gray-500" />
      </div>
    );
  }

  if (property1 === 'same-rank') {
    return (
      <div className={`${CONTAINER_CLASS} dark:text-zinc-400`}>
        <BiSolidRightArrow size={10} />
        <span className={cn('text-xs', isTopTen && 'text-base')}>
          {value}주
        </span>
      </div>
    );
  }

  type IconConfig = {
    icon: string;
    color: string;
  };

  const configs: Record<string, IconConfig> = {
    'up-less-than-5': {
      icon: '/icons/up.svg',
      color: 'text-[#18b700]',
    },
    'down-less-than-5': {
      icon: '/icons/down.svg',
      color: 'text-[#b70000]',
    },
    'down-greater-equal-than-5': {
      icon: '/icons/double-down.svg',
      color: 'text-[#b70000]',
    },
    'up-greater-equal-than-5': {
      icon: '/icons/double-up.svg',
      color: 'text-[#18b700]',
    },
  };

  const config = configs[property1] || configs['up-greater-equal-than-5'];

  return (
    <div className={CONTAINER_CLASS}>
      <img
        src={config.icon}
        alt={property1}
        className={cn('object-contain', isTopTen ? 'size-4' : 'size-2.5')}
      />
      <span
        className={cn(
          isTopTen ? 'text-base' : 'text-xs md:text-sm',
          config.color
        )}
      >
        {value}
      </span>
    </div>
  );
}
