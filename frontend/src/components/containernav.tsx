import type { NextPage } from "next";
import Image from "next/image";

export type ContainernavType = {
  className?: string;
};

const Containernav: NextPage<ContainernavType> = ({ className = "" }) => {
  return (
    <div
      className={`flex flex-col items-start justify-start pt-0 px-0 pb-1 text-left text-base text-[#586672] font-[Pretendard] ${className}`}
    >
      <div className="self-stretch flex flex-col items-start justify-start gap-1">
        <div className="rounded-[5px] border-[#9747ff] border-dashed border-[1px] overflow-hidden flex flex-col items-start justify-start p-5 gap-5">
          <div className="w-[167px] rounded-lg bg-[#fff] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
            <Image
              className="w-[18px] relative h-[17.8px]"
              width={18}
              height={17.8}
              sizes="100vw"
              alt=""
              src="/iconhome.svg"
            />
            <div className="relative font-medium">홈</div>
          </div>
          <div className="w-[167px] rounded-lg bg-[#ffd4e2] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
            <Image
              className="w-[18px] relative h-[17.8px]"
              width={18}
              height={17.8}
              sizes="100vw"
              alt=""
              src="/iconhome.svg"
            />
            <div className="relative font-medium">홈</div>
          </div>
          <div className="w-[167px] rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5 text-[#fff]">
            <Image
              className="w-[18px] relative h-[17.8px]"
              width={18}
              height={17.8}
              sizes="100vw"
              alt=""
              src="/iconhomeclick.svg"
            />
            <b className="relative">홈</b>
          </div>
        </div>
        <div className="rounded-[5px] border-[#9747ff] border-dashed border-[1px] overflow-hidden flex flex-col items-start justify-start p-5 gap-5">
          <div className="w-[167px] rounded-lg bg-[#fff] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
            <Image
              className="w-[22px] relative max-h-full overflow-hidden shrink-0"
              width={22}
              height={22}
              sizes="100vw"
              alt=""
              src="/iconweeklychart.svg"
            />
            <div className="relative font-medium">주간 차트</div>
          </div>
          <div className="w-[167px] rounded-lg bg-[#ffd4e2] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
            <Image
              className="w-[22px] relative max-h-full overflow-hidden shrink-0"
              width={22}
              height={22}
              sizes="100vw"
              alt=""
              src="/iconweeklychart.svg"
            />
            <div className="relative font-medium">주간 차트</div>
          </div>
          <div className="w-[167px] rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5 text-[#fff]">
            <Image
              className="w-[22px] relative max-h-full overflow-hidden shrink-0"
              width={22}
              height={22}
              sizes="100vw"
              alt=""
              src="/iconweeklychartclick.svg"
            />
            <b className="relative">주간 차트</b>
          </div>
        </div>
        <div className="rounded-[5px] border-[#9747ff] border-dashed border-[1px] overflow-hidden flex flex-col items-start justify-start p-5 gap-5">
          <div className="w-[167px] rounded-lg bg-[#fff] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
            <Image
              className="w-5 relative max-h-full overflow-hidden shrink-0"
              width={20}
              height={20}
              sizes="100vw"
              alt=""
              src="/iconvote.svg"
            />
            <div className="relative font-medium">투표하기</div>
          </div>
          <div className="w-[167px] rounded-lg bg-[#ffd4e2] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
            <Image
              className="w-5 relative max-h-full overflow-hidden shrink-0"
              width={20}
              height={20}
              sizes="100vw"
              alt=""
              src="/iconvote.svg"
            />
            <div className="relative font-medium">투표하기</div>
          </div>
          <div className="w-[167px] rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5 text-[#fff]">
            <Image
              className="w-5 relative max-h-full overflow-hidden shrink-0"
              width={20}
              height={20}
              sizes="100vw"
              alt=""
              src="/iconvoteclick.svg"
            />
            <b className="relative">투표하기</b>
          </div>
        </div>
        <div className="flex flex-col items-start justify-start">
          <div className="rounded-[5px] border-[#9747ff] border-dashed border-[1px] overflow-hidden flex flex-col items-start justify-start p-5 gap-5">
            <div className="w-[167px] rounded-lg bg-[#fff] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
              <Image
                className="w-5 relative h-5 overflow-hidden shrink-0"
                width={20}
                height={20}
                sizes="100vw"
                alt=""
                src="/iconsearch.svg"
              />
              <div className="relative font-medium">애니/캐릭터 찾기</div>
            </div>
            <div className="w-[167px] rounded-lg bg-[#ffd4e2] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
              <Image
                className="w-5 relative h-5 overflow-hidden shrink-0"
                width={20}
                height={20}
                sizes="100vw"
                alt=""
                src="/iconsearch.svg"
              />
              <div className="relative font-medium">애니/캐릭터 찾기</div>
            </div>
            <div className="w-[167px] rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] h-10 flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5 text-[#fff]">
              <Image
                className="w-5 relative h-5 overflow-hidden shrink-0"
                width={20}
                height={20}
                sizes="100vw"
                alt=""
                src="/iconsearchclick.svg"
              />
              <b className="relative">애니/캐릭터 찾기</b>
            </div>
          </div>
        </div>
        <div className="rounded-[5px] border-[#9747ff] border-dashed border-[1px] overflow-hidden flex flex-col items-start justify-start py-0 px-5 gap-5">
          <div className="w-[167px] rounded-lg bg-[#fff] h-10 flex flex-row items-center justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
            <Image
              className="w-5 relative max-h-full"
              width={20}
              height={20}
              sizes="100vw"
              alt=""
              src="/iconmypage.svg"
            />
            <div className="relative font-medium">마이페이지</div>
          </div>
          <div className="w-[167px] rounded-lg bg-[#ffd4e2] h-10 flex flex-row items-center justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5">
            <Image
              className="w-5 relative max-h-full"
              width={20}
              height={20}
              sizes="100vw"
              alt=""
              src="/iconmypage.svg"
            />
            <div className="relative font-medium">마이페이지</div>
          </div>
          <div className="w-[167px] rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] h-10 flex flex-row items-center justify-start py-2.5 pl-2.5 pr-3 box-border gap-2.5 text-[#fff]">
            <Image
              className="w-5 relative max-h-full"
              width={20}
              height={20}
              sizes="100vw"
              alt=""
              src="/iconmypageclick.svg"
            />
            <b className="relative">마이페이지</b>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Containernav;
