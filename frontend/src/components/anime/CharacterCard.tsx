'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// 캐릭터 데이터 타입 정의
export interface CharacterData {
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

interface CharacterCardProps {
  character: CharacterData;
  variant?: 'figma';
  index?: number;
  className?: string;
}

export default function CharacterCard({ 
  character, 
  variant = 'figma',
  index = 0,
  className 
}: CharacterCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };


  // 기본 이미지 URL
  const defaultImageUrl = "/icons/profile-default.svg";
  const imageUrl = character.imageUrl && !imageError ? character.imageUrl : defaultImageUrl;

  // index에 따른 배경색 결정 (odd/even 교차)
  const getBackgroundColor = (index: number) => {
    return index % 2 === 0 ? 'bg-[#FF9ABC]' : 'bg-[#FED783]'; // even: rose-300, odd: amber-200
  };

  // 181×250 크기에 맞는 캐릭터 카드 디자인
  return (
    <div 
      className={cn(
        "w-[180px] h-[250px]",
        className
      )}
    >
      {/* Profile 프레임 */}
      <div className="w-[181px] h-[170px] bg-[#F1F3F5] rounded-tl-[9.76px] rounded-tr-[9.76px] flex justify-center items-center relative">
        {/* 로딩 스켈레톤 */}
        {imageLoading && character.imageUrl && !imageError && (
          <div className="w-[122px] h-[122px] rounded-[9.76px] bg-gray-200 animate-pulse" />
        )}
        
        {/* 실제 이미지 */}
        <img 
          className={cn(
            "w-[122px] h-[122px] rounded-[9.76px] object-cover transition-opacity duration-200",
            imageLoading && character.imageUrl && !imageError ? "opacity-0 absolute" : "opacity-100"
          )}
          src={imageUrl}
          alt={character.nameKor}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      </div>
      
      {/* Info 프레임 */}
      <div className={cn(
        "w-[181px] h-[69px] p-2.5 rounded-bl-[9.76px] rounded-br-[9.76px] inline-flex justify-start items-center gap-2.5",
        getBackgroundColor(index)
      )}>
        <div className="w-[169px] inline-flex flex-col justify-start items-start gap-[3.25px] overflow-hidden">
          <div className="self-stretch justify-start text-black text-base font-semibold font-['Pretendard'] leading-none">
            {character.nameKor}
          </div>
             <div className="self-stretch justify-start text-black text-sm font-light font-['Pretendard'] leading-none">
               성우: {character.voiceActor ? character.voiceActor.replace(/\s*\([^)]*\)/g, '') : '미정'}
             </div>
        </div>
      </div>
    </div>
  );
}
