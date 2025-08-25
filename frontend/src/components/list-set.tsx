import type { NextPage } from "next";
import Image from "next/image";

export type ListSetType = {
  className?: string;
};

const ListSet: NextPage<ListSetType> = ({ className = "" }) => {
  return (
    <div
      className={`w-full rounded-[5px] border-[#9747ff] border-dashed border-[1px] box-border h-[168px] overflow-hidden text-right text-xl text-black font-[Pretendard] ${className}`}
    >
      <div className="absolute top-[20px] left-[20px] bg-[#fff] flex flex-row items-center justify-start gap-5">
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
            <b className="relative leading-[15px]">0표</b>
          </div>
          <div className="self-stretch w-2 flex flex-col items-center justify-center pt-[13px] px-0 pb-0 box-border">
            <b className="self-stretch relative leading-[15px] flex items-center h-[37px] shrink-0">
              /
            </b>
          </div>
          <div className="flex flex-col items-center justify-center pt-[13px] px-0 pb-0">
            <b className="relative leading-[15px]">10표</b>
          </div>
        </div>
      </div>
      <div className="absolute top-[94px] left-[20px] bg-[#fff] flex flex-row items-center justify-start">
        <div className="flex flex-row items-center justify-center gap-5">
          <div className="w-[54px] rounded-[30px] bg-[rgba(77,77,77,0.15)] h-[54px] flex flex-row items-center justify-center py-[9px] px-3 box-border">
            <Image
              className="w-full relative h-9 overflow-hidden shrink-0 object-cover"
              width={30}
              height={36}
              sizes="100vw"
              alt=""
              src="/icon3@2x.png"
            />
          </div>
          <div className="flex flex-row items-center justify-center gap-2">
            <div className="w-16 flex flex-row items-center justify-center pt-2.5 px-0 pb-[5px] box-border text-[32px] text-[#4d4d4d]">
              <b className="relative leading-[15px]">10표</b>
            </div>
            <div className="self-stretch w-2 flex flex-col items-center justify-center pt-[13px] px-0 pb-0 box-border">
              <b className="self-stretch relative leading-[15px] flex items-center h-[37px] shrink-0">
                /
              </b>
            </div>
            <div className="flex flex-col items-center justify-center pt-[13px] px-0 pb-0">
              <b className="relative leading-[15px]">10표</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListSet;
