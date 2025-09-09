'use client';

import React from 'react';
import CharacterCard, { CharacterData } from './CharacterCard';
import { cn } from '@/lib/utils';

interface CharacterListProps {
  characters: CharacterData[];
  className?: string;
}

export default function CharacterList({
  characters,
  className
}: CharacterListProps) {


  return (
    <div className={cn("w-full", className)}>
      {/* 캐릭터 목록 */}
      {characters.length > 0 ? (
        <div className="w-full flex justify-center">
          <div className="grid gap-x-[10px] gap-y-[10px] grid-cols-3 mt-5">
            {characters.map((character, index) => (
              <div 
                key={character.characterId}
                data-property-1={index % 2 === 0 ? "even" : "odd"}
                className="w-[180px] h-[250px] inline-flex flex-col justify-start items-center"
              >
                <CharacterCard
                  character={character}
                  index={index}
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
