'use client';

import React from 'react';
import CharacterCard from './CharacterCard';
import { cn } from '@/lib';
import { Character } from '@/types/dtos';

interface CharacterListProps {
  characters: Character[];
  className?: string;
  isMobile?: boolean;
}

export default function CharacterList({
  characters,
  className,
  isMobile = false,
}: CharacterListProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* 캐릭터 목록 */}
      {characters.length > 0 ? (
        <div
          className={`w-full ${isMobile ? 'flex justify-center px-3' : 'flex justify-center px-3'}`}
        >
          <div
            className={`mt-3 grid ${isMobile ? 'w-[100%] max-w-[100%] grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3 sm:gap-2' : 'grid-cols-3 gap-x-[10px] gap-y-[10px]'}`}
          >
            {characters.map((character, index) => (
              <div
                key={character.characterId}
                data-property-1={index % 2 === 0 ? 'even' : 'odd'}
                className={`${isMobile ? 'h-[225px] w-[162px]' : 'h-[250px] w-[180px]'} flex flex-col items-center justify-start justify-self-center`}
              >
                <CharacterCard
                  character={character}
                  index={index}
                  isMobile={isMobile}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="text-sm text-gray-400">등록된 캐릭터가 없습니다.</div>
        </div>
      )}
    </div>
  );
}
