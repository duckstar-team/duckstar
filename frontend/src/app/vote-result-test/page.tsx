'use client';

import VoteStamp from '../../components/vote/VoteStamp';
import Link from 'next/link';

export default function VoteResultTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">투표 결과 섹션 테스트</h1>
        
        {/* 투표 페이지로 이동 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">투표 페이지</h2>
          <div className="space-y-2">
            <Link 
              href="/vote"
              className="block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-center"
            >
              투표 페이지로 이동
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">기본 투표 결과</h2>
          <div className="bg-[#ffffff] box-border content-stretch flex flex-col lg:flex-row gap-4 lg:gap-[55px] items-center justify-center px-4 lg:px-0 py-6 relative w-full">
            <div aria-hidden="true" className="absolute border-[#ced4da] border-[0px_0px_1px] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
            
            <div className="content-stretch flex flex-col lg:flex-row gap-4 lg:gap-[60px] items-center justify-center lg:justify-end relative shrink-0">
              <VoteStamp
                type="normal"
                isActive={true}
                currentVotes={7}
                maxVotes={10}
                showResult={true}
              />
              
              <VoteStamp
                type="bonus"
                isActive={true}
                currentVotes={0}
                maxVotes={0}
                bonusVotesUsed={1}
                showResult={true}
              />
            </div>

            <div className="bg-[#f8f9fa] box-border content-stretch flex gap-2.5 items-center justify-center lg:justify-end px-5 py-[5px] relative rounded-lg shrink-0">
              <div className="flex flex-col font-['Pretendard:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-base lg:text-[20px] text-nowrap text-center lg:text-right">
                <p className="leading-[normal] whitespace-pre">제출 시각: 2025년 8월 21일 18:47</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">높은 투표 수</h2>
          <div className="bg-[#ffffff] box-border content-stretch flex flex-col lg:flex-row gap-4 lg:gap-[55px] items-center justify-center px-4 lg:px-0 py-6 relative w-full">
            <div aria-hidden="true" className="absolute border-[#ced4da] border-[0px_0px_1px] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
            
            <div className="content-stretch flex flex-col lg:flex-row gap-4 lg:gap-[60px] items-center justify-center lg:justify-end relative shrink-0">
              <VoteStamp
                type="normal"
                isActive={true}
                currentVotes={15}
                maxVotes={10}
                showResult={true}
              />
              
              <VoteStamp
                type="bonus"
                isActive={true}
                currentVotes={0}
                maxVotes={0}
                bonusVotesUsed={3}
                showResult={true}
              />
            </div>

            <div className="bg-[#f8f9fa] box-border content-stretch flex gap-2.5 items-center justify-center lg:justify-end px-5 py-[5px] relative rounded-lg shrink-0">
              <div className="flex flex-col font-['Pretendard:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-base lg:text-[20px] text-nowrap text-center lg:text-right">
                <p className="leading-[normal] whitespace-pre">제출 시각: 2025년 8월 21일 19:30</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">보너스 투표만 있는 경우</h2>
          <div className="bg-[#ffffff] box-border content-stretch flex flex-col lg:flex-row gap-4 lg:gap-[55px] items-center justify-center px-4 lg:px-0 py-6 relative w-full">
            <div aria-hidden="true" className="absolute border-[#ced4da] border-[0px_0px_1px] border-solid bottom-[-1px] left-0 pointer-events-none right-0 top-0" />
            
            <div className="content-stretch flex flex-col lg:flex-row gap-4 lg:gap-[60px] items-center justify-center lg:justify-end relative shrink-0">
              <VoteStamp
                type="bonus"
                isActive={true}
                currentVotes={0}
                maxVotes={0}
                bonusVotesUsed={5}
                showResult={true}
              />
            </div>

            <div className="bg-[#f8f9fa] box-border content-stretch flex gap-2.5 items-center justify-center lg:justify-end px-5 py-[5px] relative rounded-lg shrink-0">
              <div className="flex flex-col font-['Pretendard:Regular',_sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#000000] text-base lg:text-[20px] text-nowrap text-center lg:text-right">
                <p className="leading-[normal] whitespace-pre">제출 시각: 2025년 8월 21일 20:15</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
