'use client';

import { useState, useCallback, useMemo } from 'react';
import { WeekDto, RankPreviewDto, DuckstarRankPreviewDto } from '@/types/api';

/**
 * 홈 페이지 상태 관리 훅
 * 관련된 상태를 그룹화하여 성능 최적화
 */
export function useHomeState() {
  // Right Panel 상태 그룹
  const [rightPanelState, setRightPanelState] = useState({
    data: [] as RankPreviewDto[],
    loading: false,
    error: null as string | null,
  });

  // Left Panel 상태 그룹
  const [leftPanelState, setLeftPanelState] = useState({
    data: [] as DuckstarRankPreviewDto[],
    loading: false,
    error: null as string | null,
    isPrepared: true,
  });

  // 탭 상태 그룹
  const [tabState, setTabState] = useState({
    selectedRightTab: 'anime-corner' as 'anilab' | 'anime-corner',
    selectedWeek: null as WeekDto | null,
  });

  // 데이터 상태 그룹
  const [dataState, setDataState] = useState({
    anilabData: [] as RankPreviewDto[],
    animeCornerData: [] as RankPreviewDto[],
  });

  // UI 상태 그룹
  const [uiState, setUiState] = useState({
    isClient: false,
    isInitialized: false,
  });

  // Right Panel 데이터 업데이트
  const updateRightPanelData = useCallback((data: RankPreviewDto[]) => {
    setRightPanelState(prev => ({ ...prev, data }));
  }, []);

  // Right Panel 로딩 상태 업데이트
  const updateRightPanelLoading = useCallback((loading: boolean) => {
    setRightPanelState(prev => ({ ...prev, loading }));
  }, []);

  // Left Panel 데이터 업데이트
  const updateLeftPanelData = useCallback((data: DuckstarRankPreviewDto[], isPrepared: boolean) => {
    setLeftPanelState(prev => ({ 
      ...prev, 
      data, 
      isPrepared 
    }));
  }, []);

  // 탭 변경
  const updateSelectedRightTab = useCallback((tab: 'anilab' | 'anime-corner') => {
    setTabState(prev => ({ ...prev, selectedRightTab: tab }));
  }, []);

  // 주차 변경
  const updateSelectedWeek = useCallback((week: WeekDto | null) => {
    setTabState(prev => ({ ...prev, selectedWeek: week }));
  }, []);

  // 데이터 설정
  const updateDataState = useCallback((anilabData: RankPreviewDto[], animeCornerData: RankPreviewDto[]) => {
    setDataState({ anilabData, animeCornerData });
  }, []);

  // UI 상태 업데이트
  const updateUiState = useCallback((updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  // 스크롤 키 메모이제이션
  const scrollKey = useMemo(() => {
    if (tabState.selectedWeek) {
      return `home-${tabState.selectedWeek.year}-${tabState.selectedWeek.quarter}-${tabState.selectedWeek.week}`;
    }
    return 'home-default';
  }, [tabState.selectedWeek]);

  // 현재 탭에 맞는 데이터 반환
  const currentTabData = useMemo(() => {
    return tabState.selectedRightTab === 'anime-corner' 
      ? dataState.animeCornerData 
      : dataState.anilabData;
  }, [tabState.selectedRightTab, dataState.animeCornerData, dataState.anilabData]);

  return {
    // 상태
    rightPanelState,
    leftPanelState,
    tabState,
    dataState,
    uiState,
    scrollKey,
    currentTabData,
    
    // 업데이트 함수
    updateRightPanelData,
    updateRightPanelLoading,
    updateLeftPanelData,
    updateSelectedRightTab,
    updateSelectedWeek,
    updateDataState,
    updateUiState,
  };
}
