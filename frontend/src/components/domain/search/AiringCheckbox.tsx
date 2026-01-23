interface AiringCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  labelClassName?: string;
}

export default function AiringCheckbox({
  checked,
  onChange,
  id = 'showOnlyAiring',
  className = '',
  labelClassName = '',
}: AiringCheckboxProps) {
  return (
    <div
      className={`flex w-fit items-center justify-center gap-2 rounded-xl md:bg-white md:px-6 md:py-2.5 dark:md:bg-zinc-900 ${className}`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-brand h-4 w-4 cursor-pointer"
      />
      <label
        htmlFor={id}
        className={`cursor-pointer text-sm font-medium ${labelClassName}`}
      >
        방영 중 애니만 보기
      </label>
    </div>
  );
}
