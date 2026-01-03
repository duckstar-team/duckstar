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
