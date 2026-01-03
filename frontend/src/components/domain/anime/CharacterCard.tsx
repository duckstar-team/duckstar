'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Character } from '@/types/dtos';

interface CharacterCardProps {
  character: Character;
  variant?: 'figma';
  index?: number;
  className?: string;
  isMobile?: boolean;
}

export default function CharacterCard({
  character,
  variant = 'figma',
  index = 0,
  className,
  isMobile = false,
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
  const defaultImageUrl = '/icons/profile-default.svg';
  const imageUrl =
    character.imageUrl && !imageError ? character.imageUrl : defaultImageUrl;

  // index에 따른 배경색 결정 (odd/even 교차)
  const getBackgroundColor = (index: number) => {
    return index % 2 === 0 ? 'bg-[#FF9ABC]' : 'bg-[#FED783]'; // even: rose-300, odd: amber-200
  };

  // 181×250 크기에 맞는 캐릭터 카드 디자인
  return (
    <div
      className={cn(
        isMobile ? 'h-[225px] w-[162px]' : 'h-[250px] w-[180px]',
        'overflow-hidden', // 내부 요소가 카드 경계를 벗어나지 않도록
        className
      )}
    >
      {/* Profile 프레임 */}
      <div
        className={`${isMobile ? 'h-[153px] w-[163px]' : 'h-[170px] w-[181px]'} relative flex items-center justify-center rounded-tl-[9.76px] rounded-tr-[9.76px] bg-[#F1F3F5]`}
      >
        {/* 로딩 스켈레톤 */}
        {imageLoading && character.imageUrl && !imageError && (
          <div
            className={`${isMobile ? 'h-[110px] w-[110px]' : 'h-[122px] w-[122px]'} animate-pulse rounded-[9.76px] bg-gray-200`}
          />
        )}

        {/* 실제 이미지 */}
        <img
          className={cn(
            isMobile ? 'h-[110px] w-[110px]' : 'h-[122px] w-[122px]',
            'rounded-[9.76px] object-cover transition-opacity duration-200',
            imageLoading && character.imageUrl && !imageError
              ? 'absolute opacity-0'
              : 'opacity-100'
          )}
          src={imageUrl}
          alt={character.nameKor}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      </div>

      {/* Info 프레임 */}
      <div
        className={cn(
          isMobile ? 'h-[62px] w-[163px] p-2.5' : 'h-[69px] w-[181px] p-2.5',
          'inline-flex items-center justify-start gap-1 rounded-br-[9.76px] rounded-bl-[9.76px]',
          getBackgroundColor(index)
        )}
      >
        <div
          className={`${isMobile ? 'w-[151px]' : 'w-[169px]'} inline-flex flex-col items-start justify-start gap-[1px] overflow-hidden`}
        >
          <div
            className={`justify-start self-stretch text-black ${isMobile ? 'text-sm' : 'text-base'} leading-tight font-semibold`}
          >
            {character.nameKor}
          </div>
          <div
            className={`justify-start self-stretch text-black ${isMobile ? 'text-xs' : 'text-sm'} leading-tight font-light`}
          >
            성우:{' '}
            {character.voiceActor
              ? character.voiceActor.replace(/\s*\([^)]*\)/g, '')
              : '미정'}
          </div>
        </div>
      </div>
    </div>
  );
}
