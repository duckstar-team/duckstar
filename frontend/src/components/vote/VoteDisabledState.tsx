'use client';

import { motion } from 'framer-motion';
import { VoteStatus } from '@/types/api';

interface VoteDisabledStateProps {
  status: VoteStatus;
  weekDto?: {
    weekNumber: number;
    startDate: string;
    endDate: string;
  };
}

export default function VoteDisabledState({ status, weekDto }: VoteDisabledStateProps) {
  const getStatusMessage = () => {
    switch (status) {
      case 'PAUSED':
        return {
          title: '투표가 일시 중단되었습니다',
          description: '시스템 점검으로 인해 투표가 일시적으로 중단되었습니다.\n잠시 후 다시 시도해주세요.',
          actionText: '새로고침하여 다시 시도',
          action: () => window.location.reload()
        };
      case 'CLOSED':
        return {
          title: '마감된 투표입니다',
          description: '새로운 투표를 준비 중입니다.\n 잠시 후 다시 시도해주세요.',
          actionText: '새로고침하여 다시 시도',
          action: () => window.location.reload()
        };
      default:
        return {
          title: '투표를 이용할 수 없습니다',
          description: '현재 투표를 이용할 수 없는 상태입니다.',
          actionText: '홈으로 돌아가기',
          action: () => window.location.href = '/'
        };
    }
  };

  const message = getStatusMessage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        {/* 아이콘 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <span className="text-3xl">
            {status === 'PAUSED' ? '⏸️' : status === 'CLOSED' ? '🔒' : '❌'}
          </span>
        </motion.div>

        {/* 제목 */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-800 mb-4"
        >
          {message.title}
        </motion.h1>

        {/* 설명 */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6 whitespace-pre-line leading-relaxed"
        >
          {message.description}
        </motion.p>

        {/* 주차 정보 */}
        {weekDto && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-50 rounded-lg p-4 mb-6"
          >
            <p className="text-sm text-gray-500 mb-1">현재 주차</p>
            <p className="text-lg font-semibold text-gray-800">
              {weekDto.weekNumber}주차
            </p>
            <p className="text-sm text-gray-500">
              {weekDto.startDate} ~ {weekDto.endDate}
            </p>
          </motion.div>
        )}

        {/* 액션 버튼 */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          onClick={message.action}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 cursor-pointer"
        >
          {message.actionText}
        </motion.button>

        {/* 추가 정보 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 pt-6 border-t border-gray-200"
        >
          <p className="text-xs text-gray-400">
            {status === 'PAUSED' 
              ? '시스템 점검은 보통 몇 분 내에 완료됩니다.'
              : status === 'CLOSED'
              ? '새로운 투표가 곧 시작됩니다.'
              : '문제가 지속되면 고객센터에 문의해주세요.'
            }
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
