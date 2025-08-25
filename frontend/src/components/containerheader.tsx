import type { NextPage } from "next";
import Image from "next/image";

export type ContainerheaderType = {
  className?: string;
};

const Containerheader: NextPage<ContainerheaderType> = ({ className = "" }) => {
  return (
    <div
      className={`w-[1440px] border-[#dadce0] border-solid border-b-[1px] box-border max-w-full h-[61px] text-center text-base text-Grays-Gray font-[Pretendard] ${className}`}
    >
      <div className="absolute top-[0px] left-[0px] [backdrop-filter:blur(12px)] bg-[#fff] w-[1440px] h-[60px] opacity-[0.8]" />
      <div className="absolute top-[11px] left-[1064px] w-[336px] h-[38px]">
        <div className="absolute top-[7px] left-[294px] w-[42px] h-[22px]">
          <div className="absolute top-[0px] left-[0px] leading-[22px] font-semibold">
            로그인
          </div>
        </div>
        <div className="absolute top-[0px] left-[0px] rounded-xl bg-gray1 border-gray2 border-solid border-[1px] box-border w-[248px] overflow-hidden flex flex-row items-center justify-start py-[9px] px-4 gap-4">
          <Image
            className="w-5 relative h-5 overflow-hidden shrink-0"
            width={20}
            height={20}
            sizes="100vw"
            alt=""
            src="/icon-headerSearch.svg"
          />
          <Image
            className="w-px relative max-w-full overflow-hidden h-4 object-contain"
            width={1}
            height={16}
            sizes="100vw"
            alt=""
            src="/line-27.svg"
          />
          <div className="w-[151px] h-[17px] overflow-hidden shrink-0" />
        </div>
      </div>
      <Image
        className="absolute top-[0px] left-[25px] w-[93px] h-[60px]"
        width={93}
        height={60}
        sizes="100vw"
        alt=""
        src="/logo.svg"
      />
    </div>
  );
};

export default Containerheader;
