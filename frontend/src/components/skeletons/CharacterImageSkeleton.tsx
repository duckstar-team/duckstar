interface CharacterImageSkeletonProps {
  isMobile?: boolean;
}

export default function CharacterImageSkeleton({
  isMobile = false,
}: CharacterImageSkeletonProps) {
  return (
    <div
      className={`${isMobile ? 'h-[110px] w-[110px]' : 'h-[122px] w-[122px]'} animate-pulse rounded-[9.76px] bg-brand-zinc-200`}
    />
  );
}
