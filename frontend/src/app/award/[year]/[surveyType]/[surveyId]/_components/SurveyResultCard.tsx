'use client';

import { Schemas } from '@/types';
import React, { useMemo, memo } from 'react';
import SurveyResultComment from './SurveyResultComment';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { FaArrowCircleRight } from 'react-icons/fa';
import Link from 'next/link';

// 도넛 차트 컴포넌트
const DonutChart = memo(function DonutChart({
  percentage1,
  percentage2,
  label1,
  label2,
  color1,
  color2,
}: {
  percentage1: number;
  percentage2: number;
  label1: string;
  label2: string;
  color1: string;
  color2: string;
}) {
  const percentage1Value = percentage1 || 0;
  const percentage2Value = percentage2 || 0;

  const data = useMemo(
    () => [
      { name: label1, value: percentage1Value },
      { name: label2, value: percentage2Value },
    ],
    [label1, label2, percentage1Value, percentage2Value]
  );

  const COLORS = useMemo(() => [color1, color2], [color1, color2]);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="w-full"
        style={{ height: '120px', maxWidth: '120px', minWidth: '80px' }}
      >
        <ResponsiveContainer width="100%" height="100%" debounce={150}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="45%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-col gap-1 @max-xs:ml-4">
        <div className="flex items-start justify-center gap-2 @max-xs:justify-start">
          <div
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color1 }}
          />
          <span className="text-sm break-keep text-gray-700 dark:text-zinc-200">
            {label1} {percentage1Value.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-start justify-center gap-2 @max-xs:justify-start">
          <div
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color2 }}
          />
          <span className="text-sm break-keep text-gray-700 dark:text-zinc-200">
            {label2} {percentage2Value.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
});

// 커스텀 레이블 컴포넌트 (바 위에 퍼센트 표시) - 컴포넌트 외부로 이동하여 재생성 방지
const CustomLabel = (props: any) => {
  const { x, y, width, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="currentColor"
      textAnchor="middle"
      fontSize={12}
      fontWeight="semibold"
    >
      {Math.round(value) > 0 ? Math.round(value) + '%' : null}
    </text>
  );
};

// 연령별 분포 바 차트 컴포넌트
const AgeBarChart = memo(function AgeBarChart({
  voteRatioDto,
}: {
  voteRatioDto: Schemas['VoteRatioDto'];
}) {
  const ageData = useMemo(
    () => [
      { name: '14↓', value: voteRatioDto.under14Percent || 0 },
      { name: '15-19', value: voteRatioDto.to19Percent || 0 },
      { name: '20-24', value: voteRatioDto.to24Percent || 0 },
      { name: '25-29', value: voteRatioDto.to29Percent || 0 },
      { name: '30-34', value: voteRatioDto.to34Percent || 0 },
      { name: '35↑', value: voteRatioDto.over35Percent || 0 },
    ],
    [
      voteRatioDto.under14Percent,
      voteRatioDto.to19Percent,
      voteRatioDto.to24Percent,
      voteRatioDto.to29Percent,
      voteRatioDto.to34Percent,
      voteRatioDto.over35Percent,
    ]
  );

  const { chartData } = useMemo(() => {
    const max = Math.max(...ageData.map((d) => d.value), 1);
    const maxIdx = ageData.findIndex((item) => item.value === max && max > 0);
    const data = ageData.map((item, index) => ({
      ...item,
      fill: index === maxIdx ? '#c30b4e' : '#d1d5db',
    }));
    return { maxValue: max, maxIndex: maxIdx, chartData: data };
  }, [ageData]);

  return (
    <ResponsiveContainer width="100%" height={200} debounce={150}>
      <BarChart
        data={chartData}
        margin={{ top: 30, right: 5, left: 5, bottom: 5 }}
      >
        <Bar dataKey="value" radius={[16, 16, 0, 0]} maxBarSize={17}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList content={CustomLabel} />
        </Bar>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#A3A3A3' }}
          height={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

export default function SurveyResultCard({
  surveyRank,
  totalCount,
}: {
  surveyRank: Schemas['SurveyRankDto'];
  totalCount: number;
}) {
  const {
    animeCandidateDto,
    animeId,
    voteRatioDto,
    commentDtos,
    commentTotalCount,
    rank,
  } = surveyRank;

  return (
    <div className="relative flex flex-col gap-6">
      {/* 헤더: 분기 및 순위 */}
      <div className="flex items-center gap-6 px-4">
        <div className="flex flex-col items-center justify-center">
          {/* 원형 border (순위에 따라 1순위 전체, 2순위부터 1/n씩 차감) */}
          <svg
            className="absolute"
            width="64"
            height="64"
            style={{ transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="5"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="#c30b4e"
              strokeWidth="5"
              strokeDasharray={`${((totalCount - rank + 1) / totalCount) * (2 * Math.PI * 28)} ${2 * Math.PI * 28}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="translate-y-1 text-xs font-medium whitespace-nowrap">
            {animeCandidateDto.quarter}분기
          </span>
          <span className="text-2xl font-bold">{rank}</span>
        </div>
        <h3 className="text-2xl font-bold">{animeCandidateDto.titleKor}</h3>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex gap-6 @max-sm:flex-col">
        {/* 포스터 이미지 */}
        <div className="flex flex-col items-center justify-start gap-2 @max-sm:w-full">
          <div className="relative h-72 w-48 overflow-hidden rounded-lg">
            <img
              src={animeCandidateDto.mainThumbnailUrl || '/og-logo.jpg'}
              alt={animeCandidateDto.titleKor}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-sm font-medium text-gray-500 @sm:self-start dark:text-zinc-400">
            {animeCandidateDto.year}년 {animeCandidateDto.quarter}분기{' '}
            {animeCandidateDto.medium}
          </span>
          {animeId && (
            <Link
              href={`/animes/${animeId}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <span>애니 정보</span>
              <FaArrowCircleRight className="text-brand h-4 w-4" />
            </Link>
          )}
        </div>

        {/* 통계 정보 + 댓글 */}
        <div className="flex w-full flex-col gap-6">
          {/* 통계 정보 섹션 */}
          <div className="flex gap-10 rounded-lg bg-gray-100 p-4 @max-lg:flex-col dark:bg-zinc-700">
            <div className="max-xs:flex-col flex gap-10 transition xl:gap-16">
              {/* 득표율 */}
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                  득표율
                </h4>
                <div className="text-3xl font-medium transition @md:text-4xl">
                  {(Math.floor(voteRatioDto.votePercent * 100) / 100).toFixed(
                    2
                  )}
                  %
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 표 비율 도넛 차트 */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                    표 비율
                  </h4>
                  <DonutChart
                    percentage1={voteRatioDto.normalPercent || 0}
                    percentage2={voteRatioDto.bonusPercent || 0}
                    label1="일반"
                    label2="보너스 결합"
                    color1="#c30b4e"
                    color2="#fbbf24"
                  />
                </div>

                {/* 성비 도넛 차트 */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                    성비
                  </h4>
                  <DonutChart
                    percentage1={voteRatioDto.malePercent || 0}
                    percentage2={voteRatioDto.femalePercent || 0}
                    label1="남성"
                    label2="여성"
                    color1="#8979FF"
                    color2="#FF928A"
                  />
                </div>
              </div>
            </div>

            {/* 연령별 투표 분포 */}
            <div className="flex max-w-100 flex-1 flex-col gap-2">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
                연령별 투표 분포
              </h4>
              <AgeBarChart voteRatioDto={voteRatioDto} />
            </div>
          </div>

          {/* 댓글 섹션 */}
          {animeId && (
            <SurveyResultComment
              animeId={animeId}
              commentDtos={commentDtos}
              commentTotalCount={commentTotalCount}
              surveyCandidateId={animeCandidateDto.animeCandidateId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
