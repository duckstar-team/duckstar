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
        <span className="text-xs text-blue-400">NEW</span>
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
      <div className={CONTAINER_CLASS}>
        <img
          src="/icons/consecutive.svg"
          alt="same-rank"
          className="size-2.5"
        />
        <span className="text-xs">{value}주</span>
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
        className={`object-contain ${isTopTen ? 'h-4 w-4' : 'h-2.5 w-2.5'}`}
      />
      <span
        className={`${isTopTen ? 'text-lg' : 'text-xs md:text-sm'} ${config.color}`}
      >
        {value}
      </span>
    </div>
  );
}
