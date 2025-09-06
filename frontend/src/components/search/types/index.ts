// Search 관련 공통 타입 정의

export interface SearchFiltersProps {
  selectedOttServices: string[];
  onOttFilterChange: (ottService: string) => void;
  className?: string;
}

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder?: string;
  className?: string;
}

export interface DaySelectionProps {
  selectedDay: string;
  onDaySelect: (day: string) => void;
  onScrollToSection: (day: string) => void;
}

export interface AnimeCardProps {
  anime: AnimePreviewDto;
  className?: string;
}

export interface LeftInfoPanelProps {
  anime: AnimeDetailDto;
  className?: string;
}

// API 타입들을 직접 import하여 사용
import type { 
  AnimePreviewDto, 
  OttDto
} from '@/types/api';

// API 타입들을 재export
export type { AnimePreviewDto, OttDto };

// AnimeDetailDto는 아직 정의되지 않았으므로 임시로 정의
export interface AnimeDetailDto extends AnimePreviewDto {
  titleJpn?: string;
  year?: number;
  quarter?: number;
  studio?: string;
  director?: string;
  source?: string;
  startDate?: string;
  rating?: string;
  officialSite?: string;
}

// Search 관련 유틸리티 타입
export type SearchQuery = string;
export type OttFilter = string;
export type DayOfWeek = 'UPCOMING' | 'SUN' | 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SPECIAL';

export interface SearchState {
  query: SearchQuery;
  selectedOttServices: OttFilter[];
  selectedDay: DayOfWeek;
}

export interface SearchResults {
  groupedAnimes: Record<DayOfWeek, AnimePreviewDto[]> | null;
  loading: boolean;
  error: string | null;
}
