export interface ChartAnimeData {
  rankPreviewDto: {
    type: string;
    contentId: number;
    rank: number;
    rankDiff: number | null;
    consecutiveWeeksAtSameRank: number;
    mainThumbnailUrl: string;
    title: string;
    subTitle: string;
  };
  medalPreviews: Array<{
    type: "GOLD" | "SILVER" | "BRONZE" | "NONE";
    rank: number;
    year: number;
    quarter: number;
    week: number;
  }>;
  animeStatDto: {
    debutRank: number;
    debutDate: string;
    peakRank: number;
    peakDate: string;
    weeksOnTop10: number;
  };
  voteResultDto: {
    voterCount: number;
    info: {
      userStarScore: number | null;
      starAverage: number;
      star_0_5: number;
      star_1_0: number;
      star_1_5: number;
      star_2_0: number;
      star_2_5: number;
      star_3_0: number;
      star_3_5: number;
      star_4_0: number;
      star_4_5: number;
      star_5_0: number;
    };
  };
}

export interface ChartResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    animeRankDtos: ChartAnimeData[];
    animeTrendRankPreviews: any[];
    aniLabRankPreviews: any[];
    pageInfo: {
      hasNext: boolean;
      page: number;
      size: number;
    };
  };
}

export interface WeekDto {
  year: number;
  quarter: number;
  week: number;
  startDate: string;
  endDate: string;
}

export interface WeeksResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: WeekDto[];
}

// API call helper function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${endpoint}`;
  const config = {
    credentials: 'include' as const,
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

export const getChartData = async (
  year: number,
  quarter: number,
  week: number,
  page: number = 0
): Promise<ChartResponse> => {
  return apiCall<ChartResponse>(`/api/v1/chart/${year}/${quarter}/${week}/anime?page=${page}&size=20`);
};

export const getWeeks = async (): Promise<WeeksResponse> => {
  return apiCall<WeeksResponse>('/api/v1/chart/weeks');
};
