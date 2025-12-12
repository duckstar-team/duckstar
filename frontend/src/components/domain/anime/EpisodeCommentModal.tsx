'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import EpisodeSection from './EpisodeSection';
import CommentPostForm from './CommentPostForm';
import { getThisWeekRecord } from '../../../lib/quarterUtils';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../layout/AppContainer';
import { showToast } from '../../common/Toast';

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
  episodeResponseDtos: EpisodeDto[];
}

interface EpisodeCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeId: number;
  animeData?: AnimeHomeDto;
  rawAnimeData?: any; // 백엔드 원본 데이터
  onCommentSubmit?: (
    episodeIds: number[],
    content: string,
    images?: File[]
  ) => void;
}

// 날짜 포맷팅 함수
const formatScheduledAt = (scheduledAt: string): string => {
  const date = new Date(scheduledAt);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
  return `${month}월 ${day}일 (${dayOfWeek})`;
};

export default function EpisodeCommentModal({
  isOpen,
  onClose,
  animeId,
  animeData,
  rawAnimeData,
  onCommentSubmit,
}: EpisodeCommentModalProps) {
  // 화면 크기 감지 (768px 미만에서 드롭다운 사용)
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  const { isAuthenticated } = useAuth();
  const { openLoginModal } = useModal();
  const [selectedEpisodeIds, setSelectedEpisodeIds] = useState<number[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [episodeCurrentPage, setEpisodeCurrentPage] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // 분기/주차 계산 함수
  const getQuarterAndWeek = (date: Date) => {
    const record = getThisWeekRecord(date);

    return {
      quarter: `${record.quarterValue}분기`,
      week: `${record.weekValue}주차`,
    };
  };

  // 에피소드 데이터 처리 (rawAnimeData 사용)
  const processedEpisodes =
    rawAnimeData?.episodeResponseDtos?.map((episodeDto: any) => {
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
        isRescheduled: episodeDto.isRescheduled,
      };
    }) || [];

  // 실제 에피소드 데이터 사용
  const finalEpisodes = processedEpisodes;

  // 에피소드 클릭 핸들러 (한 개만 선택 가능, 현재 방영 중인 에피소드 제외)
  const handleEpisodeClick = (episodeId: number) => {
    // 현재 방영 중인 에피소드인지 확인
    const episode = processedEpisodes.find(
      (ep: any) => ep.episodeId === episodeId
    );
    if (!episode) return;

    // 현재 시간과 에피소드 방영 시간 비교
    const now = new Date();
    const episodeTime = new Date(episode.scheduledAt);

    // 아직 방영되지 않은 에피소드는 선택 불가
    if (episodeTime > now) {
      return;
    }

    setSelectedEpisodeIds((prev) => {
      if (prev.includes(episodeId)) {
        return []; // 선택 해제
      } else {
        // 에피소드 선택 시 경고 메시지 숨기기
        setErrorMessage('');
        return [episodeId]; // 새로 선택 (기존 선택 자동 해제)
      }
    });
  };

  // 댓글 제출 핸들러
  const handleCommentSubmit = async (content: string, images?: File[]) => {
    setErrorMessage(''); // 에러 메시지 초기화

    if (!isAuthenticated) {
      setErrorMessage('댓글을 작성하려면 로그인이 필요합니다.');
      return Promise.reject(new Error('로그인이 필요합니다.'));
    }

    if (selectedEpisodeIds.length === 0) {
      setErrorMessage('댓글을 작성할 에피소드를 선택해주세요.');
      return Promise.reject(new Error('에피소드를 선택해주세요.'));
    }

    if (!content.trim() && (!images || images.length === 0)) {
      setErrorMessage('댓글 내용을 입력하거나 이미지를 업로드해주세요.');
      return Promise.reject(new Error('댓글 내용을 입력해주세요.'));
    }

    try {
      await onCommentSubmit?.(selectedEpisodeIds, content, images);
      setCommentContent('');
      setSelectedEpisodeIds([]);
      setErrorMessage('');
      // 성공 메시지 표시
      showToast.success(
        `${animeData?.animeInfoDto?.titleKor || '애니메이션'}에 댓글이 성공적으로 작성되었습니다.`
      );
      onClose();
    } catch (error) {
      setErrorMessage('댓글 작성에 실패했습니다. 다시 시도해주세요.');
      throw error;
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨테이너 - 사이드바와 헤더를 제외한 메인 프레임 중앙 정렬 */}
      <div
        className="fixed inset-0 top-[60px] flex items-center justify-center lg:left-[240px]"
        onClick={onClose}
      >
        <div
          className="relative mx-4 max-h-[calc(100vh-120px)] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                에피소드 댓글 작성
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                지난 에피소드에 댓글을 작성할 수 있습니다.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 transition-colors hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* 컨텐츠 */}
          <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
            {/* 에피소드 섹션 */}
            <div className="mb-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                에피소드 선택
              </h3>
              {isSmallScreen ? (
                /* 768px 미만: 드롭다운 메뉴 */
                <div className="space-y-3">
                  <select
                    value={selectedEpisodeIds[0] || ''}
                    onChange={(e) => {
                      const episodeId = parseInt(e.target.value);
                      if (episodeId) {
                        setSelectedEpisodeIds([episodeId]);
                      } else {
                        setSelectedEpisodeIds([]);
                      }
                    }}
                    className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">에피소드를 선택하세요</option>
                    {finalEpisodes.map((episode) => (
                      <option key={episode.episodeId} value={episode.episodeId}>
                        {episode.episodeNumber}화 -{' '}
                        {formatScheduledAt(episode.scheduledAt)}
                      </option>
                    ))}
                  </select>
                  {selectedEpisodeIds.length > 0 && (
                    <div className="text-sm text-gray-600">
                      선택된 에피소드: {selectedEpisodeIds.length}개
                    </div>
                  )}
                </div>
              ) : (
                /* 768px 이상: 기존 EpisodeSection */
                <EpisodeSection
                  animeId={animeId}
                  episodes={finalEpisodes}
                  totalEpisodes={animeData?.animeInfoDto?.totalEpisodes}
                  selectedEpisodeIds={selectedEpisodeIds}
                  onEpisodeClick={handleEpisodeClick}
                  disableFutureEpisodes={true}
                  currentPage={episodeCurrentPage}
                  onPageChange={setEpisodeCurrentPage}
                />
              )}
            </div>

            {/* 댓글 작성 섹션 */}
            <div>
              <div className="mb-4 flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  댓글 작성
                </h3>
                {selectedEpisodeIds.length > 0 && (
                  <div className="text-2xl font-bold text-[#FFB310]">
                    {
                      processedEpisodes.find(
                        (ep: any) => ep.episodeId === selectedEpisodeIds[0]
                      )?.episodeNumber
                    }
                    화
                  </div>
                )}
              </div>

              {/* 에러 메시지 표시 */}
              {errorMessage && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-600">{errorMessage}</p>
                    {!isAuthenticated && errorMessage.includes('로그인') && (
                      <button
                        onClick={() => {
                          setErrorMessage('');
                          openLoginModal();
                        }}
                        className="ml-3 rounded-md bg-red-600 px-3 py-1 text-xs text-white transition-colors hover:bg-red-700"
                      >
                        로그인
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-center rounded-lg bg-gray-50 p-4">
                <div className="w-full max-w-[534px]">
                  <CommentPostForm
                    onSubmit={handleCommentSubmit}
                    onImageUpload={(file) => {
                      // 이미지 업로드 기능 활성화
                    }}
                    placeholder="선택한 에피소드에 대한 댓글을 작성해주세요..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
