import type { NextPage } from "next";
import Image from "next/image";

export type ToggleCheckIconSetType = {
  className?: string;
};

const ToggleCheckIconSet: NextPage<ToggleCheckIconSetType> = ({
  className = "",
}) => {
  return (
    <div
      className={`w-full rounded-[5px] border-[#9747ff] border-dashed border-[1px] box-border h-[104px] overflow-hidden ${className}`}
    >
      <div className="absolute top-[20px] left-[20px] w-[22px] h-[22px]">
        <div className="absolute top-[0px] left-[0px] rounded-[50%] border-black border-solid border-[1.8px] box-border w-[22px] h-[22px]" />
      </div>
      <div className="absolute top-[62px] left-[20px] w-[22px] h-[22px]">
        <Image
          className="absolute top-[0px] left-[0px] w-full h-[22px]"
          width={22}
          height={22}
          sizes="100vw"
          alt=""
          src="/togglecheck-icon.svg"
        />
      </div>
    </div>
  );
};

export default ToggleCheckIconSet;
