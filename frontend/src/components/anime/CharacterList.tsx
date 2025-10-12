'use client';

import React from 'react';
import CharacterCard, { CharacterData } from './CharacterCard';
import { cn } from '@/lib/utils';

interface CharacterListProps {
  characters: CharacterData[];
  className?: string;
  isMobile?: boolean;
}

export default function CharacterList({
  characters,
  className,
  isMobile = false
}: CharacterListProps) {


  return (
    <div className={cn("w-full", className)}>
      {/* 캐릭터 목록 */}
      {characters.length > 0 ? (
        <div className={`w-full ${isMobile ? 'flex justify-center px-3' : 'flex justify-center px-3'}`}>
          <div className={`grid mt-3 ${isMobile ? 'grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5 sm:gap-2 w-[100%] max-w-[100%]' : 'grid-cols-3 gap-x-[10px] gap-y-[10px]'}`}>
            {characters.map((character, index) => (
              <div 
                key={character.characterId}
                data-property-1={index % 2 === 0 ? "even" : "odd"}
                className={`${isMobile ? 'w-[162px] h-[225px]' : 'w-[180px] h-[250px]'} flex flex-col justify-start items-center justify-self-center`}
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
        <div className="text-center py-8">
          <div className="text-gray-400 text-sm">
            등록된 캐릭터가 없습니다.
          </div>
        </div>
      )}
    </div>
  );
}
