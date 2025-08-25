import type { NextPage } from "next";
import Image from "next/image";

export type SearchbarType = {
  className?: string;
};

const Searchbar: NextPage<SearchbarType> = ({ className = "" }) => {
  return (
    <div
      className={`max-w-full flex flex-row items-center justify-start gap-5 ${className}`}
    >
      <Image
        className="w-[39px] relative h-[39px]"
        width={39}
        height={39}
        sizes="100vw"
        alt=""
        src="/icon-animeCandidateSearch.svg"
      />
      <div className="w-[380px] bg-[#fff] border-Main border-solid border-b-[2px] box-border h-[45px] overflow-hidden shrink-0 flex flex-row items-center justify-start py-[13px] px-[25px]">
        <div className="flex-1 h-[22px] overflow-hidden" />
      </div>
    </div>
  );
};

export default Searchbar;
