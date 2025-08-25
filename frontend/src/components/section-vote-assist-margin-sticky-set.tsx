import type { NextPage } from "next";
import Image from "next/image";

export type SectionVoteAssistMarginStickySetType = {
  className?: string;
  mode?: 'normal' | 'askBonus' | 'completed';
  selectedCount?: number;
  maxCount?: number;
};

const SectionVoteAssistMarginStickySet: NextPage<
  SectionVoteAssistMarginStickySetType
> = ({ className = "", mode = 'normal', selectedCount = 0, maxCount = 10 }) => {
  return (
    <div
      className={`w-full rounded-[5px] border-[#9747ff] border-dashed border-[1px] box-border overflow-hidden flex flex-col items-start justify-start p-5 gap-5 text-left text-base text-[#23272b] font-[Pretendard] ${className}`}
    >
      <div className="self-stretch h-40 flex flex-col items-center justify-end">
        <div className="self-stretch flex flex-col items-start justify-center pt-0 pb-[15px] pl-[35px] pr-[58px]">
          <div className="rounded-lg bg-[#f1f2f3] h-9 flex flex-row items-center justify-center py-0 pl-2 pr-5 box-border">
            <Image
              className="w-9 h-4"
              width={36}
              height={16}
              sizes="100vw"
              alt=""
              src="/margin.svg"
            />
            <div className="relative font-semibold">
              {mode === 'normal' && '분기 신작 애니메이션을 투표해주세요!'}
              {mode === 'askBonus' && '보너스 투표를 진행하시겠습니까?'}
              {mode === 'completed' && '투표가 완료되었습니다!'}
            </div>
          </div>
        </div>
        <div className="w-[1139px] relative border-gray2 border-solid border-t-[1px] box-border h-px" />
        <div className="self-stretch bg-[#fff] border-gray4 border-solid border-b-[1px] box-border h-[101px] flex flex-row items-center justify-start py-6 pl-[35px] pr-[30px] gap-[29px] text-right text-xl text-black flex-wrap">
          <div className="flex flex-row items-center justify-start gap-5 flex-shrink-0">
            <Image
              className="w-[39px] relative h-[39px]"
              width={39}
              height={39}
              sizes="100vw"
              alt=""
              src="/icon-animeCandidateSearch.svg"
            />
            <div className="w-[380px] sm:w-full bg-[#fff] border-Main border-solid border-b-[2px] box-border h-[45px] overflow-hidden shrink-0 flex flex-row items-center justify-start py-[13px] px-[25px]">
              <div className="flex-1 h-[22px] overflow-hidden" />
            </div>
          </div>
          <div className="w-[737px] sm:w-full flex flex-row items-center justify-end py-2.5 pl-2.5 pr-[58px] box-border gap-[55px] sm:gap-4 flex-wrap">
            <div className="bg-[#fff] flex flex-row items-center justify-start gap-5">
              <div className="w-[54px] rounded-[30px] bg-[rgba(153,0,51,0.15)] h-[54px] flex flex-row items-center justify-center py-[9px] px-3 box-border">
                <Image
                  className="w-full relative h-9 overflow-hidden shrink-0 object-cover"
                  width={30}
                  height={36}
                  sizes="100vw"
                  alt=""
                  src="/icon1@2x.png"
                />
              </div>
              <div className="flex flex-row items-center justify-center gap-2">
                <div className="flex flex-row items-center justify-center pt-2.5 px-0 pb-[5px] text-[32px] text-Main">
                  <b className="relative leading-[15px]">{selectedCount}표</b>
                </div>
                <div className="self-stretch w-2 flex flex-col items-center justify-center pt-[13px] px-0 pb-0 box-border">
                  <b className="self-stretch relative leading-[15px] flex items-center h-[37px] shrink-0">
                    /
                  </b>
                </div>
                <div className="flex flex-col items-center justify-center pt-[13px] px-0 pb-0">
                  <b className="relative leading-[15px]">{maxCount}표</b>
                </div>
              </div>
            </div>
            <div className="rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 text-left text-base text-[#fff]">
              <b className="relative">
                {mode === 'normal' && 'NEXT'}
                {mode === 'askBonus' && 'BONUS'}
                {mode === 'completed' && 'DONE'}
              </b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionVoteAssistMarginStickySet;
