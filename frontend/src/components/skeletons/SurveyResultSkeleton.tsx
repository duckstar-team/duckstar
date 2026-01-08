import React from 'react';

export default function SurveyResultSkeleton() {
  return (
    <div className="max-width space-y-20">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="relative flex flex-col gap-6">
          {/* 헤더: 분기 및 순위 */}
          <div className="flex items-center gap-6 px-4">
            <div className="flex flex-col items-center justify-center">
              {/* 원형 border 스켈레톤 */}
              <div className="relative h-16 w-16">
                <div className="h-16 w-16 animate-pulse rounded-full bg-gray-200" />
              </div>
            </div>
            <div className="h-8 w-64 animate-pulse rounded bg-gray-200" />
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className="flex gap-6 @max-sm:flex-col">
            {/* 포스터 이미지 */}
            <div className="flex flex-col items-center justify-start gap-2 @max-sm:w-full">
              <div className="h-72 w-48 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200 @sm:self-start" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
            </div>

            {/* 통계 정보 + 댓글 */}
            <div className="flex w-full flex-col gap-6">
              {/* 통계 정보 섹션 */}
              <div className="flex gap-10 rounded-lg bg-gray-100 p-4 @max-lg:flex-col">
                <div className="max-xs:flex-col flex gap-10 transition xl:gap-16">
                  {/* 득표율 */}
                  <div className="flex flex-col gap-4">
                    <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                    <div className="h-10 w-24 animate-pulse rounded bg-gray-200 @md:h-12" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {/* 표 비율 도넛 차트 */}
                    <div className="flex flex-col gap-4">
                      <div className="h-5 w-16 animate-pulse rounded bg-gray-200" />
                      <div className="flex flex-col gap-3">
                        <div
                          className="h-[120px] w-full animate-pulse rounded-full bg-gray-200"
                          style={{ maxWidth: '120px', minWidth: '80px' }}
                        />
                        <div className="flex flex-col gap-1 @max-xs:ml-4">
                          <div className="flex items-center justify-center gap-2 @max-xs:justify-start">
                            <div className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-gray-200" />
                            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                          </div>
                          <div className="flex items-center justify-center gap-2 @max-xs:justify-start">
                            <div className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-gray-200" />
                            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 성비 도넛 차트 */}
                    <div className="flex flex-col gap-4">
                      <div className="h-5 w-12 animate-pulse rounded bg-gray-200" />
                      <div className="flex flex-col gap-3">
                        <div
                          className="h-[120px] w-full animate-pulse rounded-full bg-gray-200"
                          style={{ maxWidth: '120px', minWidth: '80px' }}
                        />
                        <div className="flex flex-col gap-1 @max-xs:ml-4">
                          <div className="flex items-center justify-center gap-2 @max-xs:justify-start">
                            <div className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-gray-200" />
                            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                          </div>
                          <div className="flex items-center justify-center gap-2 @max-xs:justify-start">
                            <div className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-gray-200" />
                            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 연령별 투표 분포 */}
                <div className="flex max-w-100 flex-1 flex-col gap-2">
                  <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="h-[200px] w-full animate-pulse rounded bg-gray-200" />
                </div>
              </div>

              {/* 댓글 섹션 */}
              <div className="h-12 w-full animate-pulse rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
