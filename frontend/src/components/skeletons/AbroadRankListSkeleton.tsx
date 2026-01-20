export default function AbroadRankListSkeleton() {
  return (
    <div className="absolute inset-0 space-y-4 p-4">
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="bg-gray-10 h-24 w-full rounded-xl opacity-50"
        >
          <div className="flex h-full items-center justify-center space-x-4 p-4">
            <div className="h-5 w-5 rounded bg-brand-zinc-200"></div>
            <div className="h-20 w-14 rounded-lg bg-brand-zinc-200"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-brand-zinc-200"></div>
              <div className="h-3 w-1/2 rounded bg-brand-zinc-200"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
