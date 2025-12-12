export interface Anime {
  animeId: number; // TODO: 확인 필요
  titleKor: string;
  dayOfWeek:
    | 'MON'
    | 'TUE'
    | 'WED'
    | 'THU'
    | 'FRI'
    | 'SAT'
    | 'SUN'
    | 'SPECIAL'
    | 'NONE';
  airTime: string | null;
  medium: 'SPECIAL' | 'TVA' | 'MOVIE' | 'OVA';
  genre: string;
  mainThumbnailUrl: string;
}

export interface Character {
  characterId: number;
  nameKor: string;
  nameJpn?: string;
  nameEng?: string;
  imageUrl?: string;
  description?: string;
  voiceActor?: string;
  role?: 'MAIN' | 'SUPPORTING' | 'MINOR';
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  age?: number;
  height?: number;
  weight?: number;
  birthday?: string;
  bloodType?: string;
  occupation?: string;
  affiliation?: string;
  personality?: string[];
  abilities?: string[];
  relationships?: Array<{
    characterId: number;
    characterName: string;
    relationship: string;
  }>;
}
