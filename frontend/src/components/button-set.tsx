import type { NextPage } from "next";

export type ButtonSetType = {
  className?: string;
};

const ButtonSet: NextPage<ButtonSetType> = ({ className = "" }) => {
  return (
    <div
      className={`w-full rounded-[5px] border-[#9747ff] border-dashed border-[1px] box-border h-[138px] overflow-hidden text-left text-base text-[#fff] font-[Pretendard] ${className}`}
    >
      <div className="absolute top-[20px] left-[20px] rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3">
        <b className="relative">NEXT</b>
      </div>
      <div className="absolute top-[79px] left-[20px] rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] flex flex-row items-start justify-start py-2.5 pl-2.5 pr-3">
        <b className="relative">제출하기</b>
      </div>
    </div>
  );
};

export default ButtonSet;
