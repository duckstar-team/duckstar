'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import EpisodeSection from './EpisodeSection';
import CommentPostForm from './CommentPostForm';
import { getBusinessQuarter, calculateBusinessWeekNumber, getQuarterInKorean } from '../../lib/quarterUtils';
import { useAuth } from '../../context/AuthContext';
import { startKakaoLogin } from '../../api/client';

// API 응답 타입 정의
interface EpisodeDto {
  episodeId: number;
  episodeNumber: number;
  isBreak: boolean;
  scheduledAt: string;
  isRescheduled: boolean;
  nextEpScheduledAt?: string;
}

interface AnimeInfoDto {
  medium: string;
  status: string;
  totalEpisodes: number;
  premiereDateTime: string;
  titleKor: string;
  titleOrigin?: string;
  dayOfWeek?: string;
  airTime?: string;
  corp?: string;
  director?: string;
  genre?: string;
  author?: string;
  minAge?: number;
  officalSite?: Record<string, string>;
  mainImageUrl?: string;
  mainThumbnailUrl?: string;
  seasonDtos?: Array<{
    year: number;
    seasonType: string;
  }>;
  ottDtos?: Array<{
    ottType: string;
    watchUrl: string;
  }>;
}

interface AnimeHomeDto {
  animeInfoDto: AnimeInfoDto;
  episodeDtos: EpisodeDto[];
}

interface EpisodeCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeId: number;
  animeData?: AnimeHomeDto;
  onCommentSubmit?: (episodeIds: number[], content: string, images?: File[]) => void;
}

export default function EpisodeCommentModal({
  isOpen,
  onClose,
  animeId,
  animeData,
  onCommentSubmit
}: EpisodeCommentModalProps) {
  const { isAuthenticated } = useAuth();
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [commentContent, setCommentContent] = useState('');

  // 분기/주차 계산 함수
  const getQuarterAndWeek = (date: Date) => {
    const quarter = getBusinessQuarter(date);
    const weekNumber = calculateBusinessWeekNumber(date);
    
    return { 
      quarter: getQuarterInKorean(quarter), 
      week: `${weekNumber}주차` 
    };
  };

  // 에피소드 데이터 처리
  const processedEpisodes = animeData?.episodeDtos.map(episodeDto => {
    const scheduledAt = new Date(episodeDto.scheduledAt);
    const { quarter, week } = getQuarterAndWeek(scheduledAt);
    
    return {
      id: episodeDto.episodeId,
      episodeId: episodeDto.episodeId,
      episodeNumber: episodeDto.episodeNumber,
      scheduledAt: episodeDto.scheduledAt,
      quarter,
      week,
      isBreak: episodeDto.isBreak,
      isRescheduled: episodeDto.isRescheduled
    };
  }) || [];

  // 에피소드 클릭 핸들러 (한 개만 선택 가능, 현재 방영 중인 에피소드 제외)
  const handleEpisodeClick = (episodeId: number) => {
    // 현재 방영 중인 에피소드인지 확인
    const episode = processedEpisodes.find(ep => ep.episodeId === episodeId);
    if (!episode) return;

    // 현재 시간과 에피소드 방영 시간 비교
    const now = new Date();
    const episodeTime = new Date(episode.scheduledAt);
    
    // 아직 방영되지 않은 에피소드는 선택 불가
    if (episodeTime > now) {
      return;
    }

    setSelectedEpisodeIds(prev => {
      if (prev.includes(episodeId)) {
        return []; // 선택 해제
      } else {
        return [episodeId]; // 새로 선택 (기존 선택 자동 해제)
      }
    });
  };

  // 댓글 제출 핸들러
  const handleCommentSubmit = async (content: string, images?: File[]) => {
    if (!isAuthenticated) {
      const shouldLogin = confirm('댓글을 작성하려면 로그인이 필요합니다. 로그인하시겠습니까?');
      if (shouldLogin) {
        startKakaoLogin();
      }
      return;
    }

    if (selectedEpisodeIds.length === 0) {
      alert('댓글을 작성할 에피소드를 선택해주세요.');
      return;
    }

    if (!content.trim() && (!images || images.length === 0)) {
      alert('댓글 내용을 입력하거나 이미지를 업로드해주세요.');
      return;
    }

    try {
      await onCommentSubmit?.(selectedEpisodeIds, content, images);
      setCommentContent('');
      setSelectedEpisodeIds([]);
      onClose();
    } catch (error) {
      alert('댓글 작성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 모달이 열릴 때 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 모달 컨테이너 - 사이드바와 헤더를 제외한 메인 프레임 중앙 정렬 */}
      <div className="absolute inset-0 flex items-center justify-center lg:left-[240px] top-[60px]">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[calc(100vh-120px)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-['Pretendard']">
              에피소드 댓글 작성
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              지난 에피소드에 댓글을 작성할 수 있습니다.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 에피소드 섹션 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 font-['Pretendard']">
              에피소드 선택
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <EpisodeSection
                episodes={processedEpisodes}
                totalEpisodes={processedEpisodes.length}
                selectedEpisodeIds={selectedEpisodeIds}
                onEpisodeClick={handleEpisodeClick}
                disableFutureEpisodes={true}
              />
            </div>
          </div>

          {/* 댓글 작성 섹션 */}
          <div>
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 font-['Pretendard']">
                댓글 작성
              </h3>
              {selectedEpisodeIds.length > 0 && (
                <div className="text-2xl font-bold text-[#FFB310] font-['Pretendard']">
                  {processedEpisodes.find(ep => ep.episodeId === selectedEpisodeIds[0])?.episodeNumber}화
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 pr-25 flex justify-center">
              <div className="w-full max-w-md">
                <CommentPostForm
                  onSubmit={handleCommentSubmit}
                  onImageUpload={(file) => {
                    // 이미지 업로드 기능은 현재 구현되지 않음
                  }}
                  placeholder="선택한 에피소드에 대한 댓글을 작성해주세요..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-['Pretendard']"
          >
            취소
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
