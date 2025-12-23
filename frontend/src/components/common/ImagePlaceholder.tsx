interface ImagePlaceholderProps {
  width?: string;
  height?: string;
  className?: string;
  type?: 'anime' | 'character';
}

export default function ImagePlaceholder({
  width = 'w-14',
  height = 'h-20',
  className = '',
  type = 'anime',
}: ImagePlaceholderProps) {
  return (
    <div
      className={`${width} ${height} relative flex items-center justify-center rounded-lg bg-gray-100 ${className}`}
    >
      <div className="flex items-center justify-center text-gray-400">
        {type === 'anime' ? (
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </div>
  );
}
