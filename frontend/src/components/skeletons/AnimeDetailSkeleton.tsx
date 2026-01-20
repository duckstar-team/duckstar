import EpisodeSectionSkeleton from './EpisodeSectionSkeleton';

function LeftPanelSkeleton() {
  return (
    <div
      className="animate-pulse rounded-2xl shadow-lg"
      style={{ minHeight: 'calc(100vh - 120px)' }}
    >
      <div className="h-[300px] rounded-t-2xl bg-brand-zinc-200" />
      <div className="space-y-3 p-6">
        <div className="h-6 w-3/4 rounded bg-brand-zinc-200" />
        <div className="h-4 w-1/2 rounded bg-brand-zinc-200" />
        <div className="mt-4 flex gap-4">
          <div className="h-8 w-16 rounded bg-brand-zinc-200" />
          <div className="h-8 w-20 rounded bg-brand-zinc-200" />
          <div className="h-8 w-20 rounded bg-brand-zinc-200" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-4 rounded bg-brand-zinc-200" />
          <div className="h-4 w-5/6 rounded bg-brand-zinc-200" />
          <div className="h-4 w-4/6 rounded bg-brand-zinc-200" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-1/3 rounded bg-brand-zinc-200" />
          <div className="h-3 w-1/4 rounded bg-brand-zinc-200" />
        </div>
      </div>
    </div>
  );
}

function CommentSectionSkeleton() {
  return (
    <>
      <div className="sticky top-[60px] z-20  px-6 py-4">
        <div className="h-6 w-1/3 rounded bg-brand-zinc-200" />
      </div>
      <div className="px-6 py-4">
        <div className="space-y-3 rounded-lg bg-brand-zinc-200 p-4">
          <div className="h-4 w-1/4 rounded bg-brand-zinc-200" />
          <div className="h-20 rounded bg-brand-zinc-200" />
          <div className="flex justify-end">
            <div className="h-8 w-16 rounded bg-brand-zinc-200" />
          </div>
        </div>
      </div>
      <div className="space-y-4 px-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-brand-zinc-200" />
              <div className="h-4 w-20 rounded bg-brand-zinc-200" />
              <div className="h-3 w-16 rounded bg-brand-zinc-200" />
            </div>
            <div className="ml-11 space-y-2">
              <div className="h-4 rounded bg-brand-zinc-200" />
              <div className="h-4 w-3/4 rounded bg-brand-zinc-200" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function AnimeDetailSkeleton() {
  return (
    <main
      className="w-full max-w-full overflow-x-hidden overflow-y-visible"
      style={{ minHeight: 'calc(100vh - 60px)' }}
    >
      {/* 데스크톱 - 1280px 이상 */}
      <div className="hidden w-full xl:block">
        <div className="w-full px-4">
          <div className="mx-auto flex max-w-7xl gap-4">
            <div className="max-w-[584px] min-w-0 flex-1">
              <LeftPanelSkeleton />
            </div>
            <div className="w-full max-w-[610px] min-w-0 flex-1">
              <div
                className="animate-pulse border-x border-brand-zinc-100 "
                style={{ minHeight: 'calc(100vh - 60px)' }}
              >
                <div className="flex justify-center pt-7 pb-1">
                  <EpisodeSectionSkeleton />
                </div>
                <CommentSectionSkeleton />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 중간 - 1024px~1279px */}
      <div className="hidden w-full lg:block xl:hidden">
        <div className="w-full px-4">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-[584px] pt-[30px]">
              <LeftPanelSkeleton />
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 - 1024px 미만 */}
      <div className="w-full lg:hidden">
        <div className="w-full px-1">
          <div
            className="animate-pulse rounded-2xl  shadow-lg"
            style={{ minHeight: 'calc(100vh - 120px)' }}
          >
            <div className="h-[300px] rounded-t-2xl bg-gradient-to-r from-brand-zinc-200 to-brand-zinc-300" />
            <div className="space-y-3 p-6">
              <div className="h-6 w-3/4 rounded bg-brand-zinc-200" />
              <div className="h-4 w-1/2 rounded bg-brand-zinc-200" />
              <div className="mt-4 flex gap-4">
                <div className="h-8 w-16 rounded bg-brand-zinc-200" />
                <div className="h-8 w-20 rounded bg-brand-zinc-200" />
                <div className="h-8 w-20 rounded bg-brand-zinc-200" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-4 rounded bg-brand-zinc-200" />
                <div className="h-4 w-5/6 rounded bg-brand-zinc-200" />
                <div className="h-4 w-4/6 rounded bg-brand-zinc-200" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-1/3 rounded bg-brand-zinc-200" />
                <div className="h-3 w-1/4 rounded bg-brand-zinc-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
