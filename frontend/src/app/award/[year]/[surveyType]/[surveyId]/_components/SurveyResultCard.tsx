'use client';

import { SurveyRankDto } from '@/types';
import React, { useState } from 'react';
import Comment from '@/components/domain/comment/Comment';
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
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { createComment } from '@/api/comment';
import { showToast } from '@/components/common/Toast';
import ConfirmModal from '@/components/common/ConfirmModal';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useComments } from '@/hooks/useComments';

// 도넛 차트 컴포넌트
function DonutChart({
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

  const data = [
    { name: label1, value: percentage1Value },
    { name: label2, value: percentage2Value },
  ];

  const COLORS = [color1, color2];

  return (
    <div className="flex flex-col gap-3">
      <div
        className="w-full"
        style={{ height: '120px', maxWidth: '120px', minWidth: '80px' }}
      >
        <ResponsiveContainer width="100%" height="100%">
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
        <div className="flex items-center justify-center gap-2 @max-xs:justify-start">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color1 }}
          />
          <span className="text-sm break-keep text-gray-700">
            {label1} {percentage1Value.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 @max-xs:justify-start">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: color2 }}
          />
          <span className="text-sm break-keep text-gray-700">
            {label2} {percentage2Value.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// 연령별 분포 바 차트 컴포넌트
function AgeBarChart({ voteRatioDto }: { voteRatioDto: any }) {
  const ageData = [
    { name: '14↓', value: voteRatioDto.under14Percent || 0 },
    { name: '15-19', value: voteRatioDto.to19Percent || 0 },
    { name: '20-24', value: voteRatioDto.to24Percent || 0 },
    { name: '25-29', value: voteRatioDto.to29Percent || 0 },
    { name: '30-34', value: voteRatioDto.to34Percent || 0 },
    { name: '35↑', value: voteRatioDto.over35Percent || 0 },
  ];

  const maxValue = Math.max(...ageData.map((d) => d.value), 1);
  // 가장 높은 값을 가진 인덱스 찾기
  const maxIndex = ageData.findIndex(
    (item) => item.value === maxValue && maxValue > 0
  );

  // 하이라이트 색상 적용을 위한 데이터 변환
  const chartData = ageData.map((item, index) => ({
    ...item,
    fill: index === maxIndex ? '#c30b4e' : '#d1d5db',
  }));

  // 커스텀 레이블 컴포넌트 (바 위에 퍼센트 표시)
  const CustomLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="#374151"
        textAnchor="middle"
        fontSize={12}
        fontWeight="semibold"
      >
        {Math.round(value) > 0 ? Math.round(value) + '%' : null}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={chartData}
        margin={{ top: 30, right: 5, left: 5, bottom: 5 }}
      >
        <Bar dataKey="value" radius={[16, 16, 0, 0]} maxBarSize={20}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList content={CustomLabel} />
        </Bar>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6b7280' }}
          height={30}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function SurveyResultCard({
  surveyRank,
}: {
  surveyRank: SurveyRankDto;
}) {
  const {
    animeCandidateDto,
    animeId,
    voteRatioDto,
    commentDtos,
    commentTotalCount,
    rank,
  } = surveyRank;
  const { user } = useAuth();
  const { deleteComment } = useComments(animeId);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isConfirm, setIsConfirm] = useState(false);

  const { surveyId: surveyIdParam } = useParams();
  const surveyId = Number(surveyIdParam);
  const queryClient = useQueryClient();

  const handleCommentSubmit = async (animeId: number, comment: string) => {
    try {
      await createComment(animeId, { body: comment });
      await queryClient.refetchQueries({
        queryKey: ['survey-result', surveyId],
      });
      setComment('');
      setIsCommenting(false);
      showToast.success('댓글이 작성되었습니다.');
    } catch (error) {
      console.error(error);
      showToast.error('댓글 작성에 실패했습니다.');
    }
  };

  const handleCommentFocus = () => {
    if (!user) {
      setIsConfirm(true);
    } else {
      setIsCommenting(true);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 헤더: 분기 및 순위 */}
      <div className="flex items-center gap-6 px-4">
        <div className="flex flex-col items-center justify-center">
          {/* 원형 border (순위에 따라 1/n만 채워짐) */}
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
              strokeDasharray={`${(2 * Math.PI * 28) / rank} ${2 * Math.PI * 28}`}
              strokeLinecap="round"
            />
          </svg>
          <span className="translate-y-1 text-xs font-medium whitespace-nowrap text-black">
            {animeCandidateDto.quarter}분기
          </span>
          <span className="text-2xl font-bold text-black">{rank}</span>
        </div>
        <h3 className="text-2xl font-bold text-black">
          {animeCandidateDto.titleKor}
        </h3>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex gap-6 @max-sm:flex-col">
        {/* 포스터 이미지 */}
        <div className="flex flex-col items-center justify-start gap-2 @max-sm:w-full">
          <div className="relative h-72 w-48 overflow-hidden rounded-lg bg-gray-100">
            <img
              src={animeCandidateDto.mainThumbnailUrl || '/og-logo.jpg'}
              alt={animeCandidateDto.titleKor}
              className="h-full w-full object-cover"
            />
          </div>
          <span className="text-sm font-medium text-gray-500 @sm:self-start">
            {animeCandidateDto.year}년 {animeCandidateDto.quarter}분기{' '}
            {animeCandidateDto.medium}
          </span>
          {animeId && (
            <Link
              href={`/animes/${animeId}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-400 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <span>애니 정보</span>
              <FaArrowCircleRight className="h-4 w-4 text-[#c30b4e]" />
            </Link>
          )}
        </div>

        {/* 통계 정보 + 댓글 */}
        <div className="flex w-full flex-col gap-6">
          {/* 통계 정보 섹션 */}
          <div className="flex gap-10 rounded-lg bg-gray-100 p-4 @max-lg:flex-col">
            <div className="max-xs:flex-col flex gap-10 transition xl:gap-16">
              {/* 득표율 */}
              <div className="flex flex-col gap-4">
                <h4 className="text-sm font-semibold text-gray-700">득표율</h4>
                <div className="text-3xl font-medium text-black transition @md:text-4xl">
                  {voteRatioDto.votePercent?.toFixed(1) || '0.0'}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* 표 비율 도넛 차트 */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-sm font-semibold text-gray-700">
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
                  <h4 className="text-sm font-semibold text-gray-700">성비</h4>
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
              <h4 className="text-sm font-semibold text-gray-700">
                연령별 투표 분포
              </h4>
              <AgeBarChart voteRatioDto={voteRatioDto} />
            </div>
          </div>

          {/* 댓글 섹션 */}
          <button
            onClick={() => setIsCommentOpen((prev) => !prev)}
            className="flex items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-lg font-semibold text-gray-800"
          >
            댓글 {commentTotalCount}개
            <ChevronDown
              className={cn(
                'text-gray-500 transition',
                isCommentOpen && 'rotate-180'
              )}
            />
          </button>

          {/* 댓글 아이템 */}
          <AnimatePresence initial={false}>
            {isCommentOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  height: { duration: 0.2, ease: 'easeInOut' },
                  opacity: { duration: 0.2, ease: 'easeInOut' },
                }}
              >
                {commentDtos.map((commentDto) => (
                  <Comment
                    key={commentDto.commentId}
                    comment={commentDto}
                    className="bg-transparent!"
                    onDelete={() =>
                      deleteComment(
                        commentDto.commentId,
                        animeCandidateDto.animeCandidateId,
                        surveyId
                      )
                    }
                  />
                ))}
                <div className="mt-6 flex flex-col gap-2 px-4">
                  <div className="flex items-center gap-2">
                    <img
                      src={
                        user?.profileImageUrl || '/icons/profile-default.svg'
                      }
                      alt={user?.nickname}
                      className="aspect-square w-7 rounded-full"
                    />
                    <input
                      type="text"
                      placeholder="댓글 추가..."
                      className="w-full border-b border-gray-300 p-1 text-sm focus:border-black"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      onFocus={handleCommentFocus}
                    />
                  </div>
                  {isCommenting && (
                    <div className="flex w-full justify-end gap-1 text-xs font-medium">
                      <button
                        onClick={() => setIsCommenting(false)}
                        className="rounded-full px-3 py-2 hover:bg-gray-200"
                      >
                        취소
                      </button>
                      <button
                        disabled={!comment.trim()}
                        onClick={() => handleCommentSubmit(animeId, comment)}
                        className="rounded-full bg-black px-3 py-2 text-white hover:opacity-80 disabled:cursor-not-allowed! disabled:bg-gray-200/80 disabled:text-gray-400"
                      >
                        댓글 작성
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {isConfirm && (
            <ConfirmModal
              title="댓글 작성"
              description="댓글을 작성하기 위해서는 로그인이 필요합니다."
              setIsConfirm={setIsConfirm}
            />
          )}
        </div>
      </div>
    </div>
  );
}
