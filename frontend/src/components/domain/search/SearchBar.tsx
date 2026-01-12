import { cn } from '@/lib';
import { IoSearch } from 'react-icons/io5';

type SearchBarVariant = 'default' | 'header' | 'simple';

type VariantConfig = {
  container: string;
  icon: {
    className: string;
    wrapper?: string;
    asButton?: boolean;
  };
  input?: string;
};

const variantConfigs: Record<SearchBarVariant, VariantConfig> = {
  default: {
    container:
      'flex size-full items-center rounded-lg border border-gray-200 bg-white px-4 py-3',
    icon: {
      className: 'size-4 text-amber-400',
      wrapper:
        'flex size-7 shrink-0 items-center justify-center rounded-md border border-amber-400 bg-amber-50 transition hover:bg-amber-100 md:size-8',
      asButton: true,
    },
    input: 'ml-4 text-gray-900 sm:text-base',
  },
  header: {
    container:
      'flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2',
    icon: {
      className: 'size-5 text-gray-400/80',
    },
  },
  simple: {
    container: 'flex items-center gap-4',
    icon: {
      className: 'text-brand size-5',
    },
    input: 'border-brand/80 w-2/3 border-b-2 px-1 py-2',
  },
};

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  variant?: SearchBarVariant;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = '검색어를 입력하세요',
  variant = 'default',
  className,
}: SearchBarProps) {
  const config = variantConfigs[variant];
  const IconComponent = config.icon.asButton ? 'button' : 'div';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSearch?.();
      }}
      data-search-bar={variant === 'header' ? true : undefined}
      className={cn(config.container, className)}
    >
      {/* Search Icon */}
      <IconComponent
        {...(config.icon.asButton
          ? {
              onClick: onSearch,
              type: 'button' as const,
            }
          : {})}
        className={config.icon.wrapper}
      >
        <IoSearch className={config.icon.className} />
      </IconComponent>

      {/* Search Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full text-sm text-gray-700 placeholder-gray-400',
          config.input
        )}
        autoComplete="off"
        spellCheck="false"
      />
    </form>
  );
}
