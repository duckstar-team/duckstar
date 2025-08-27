import type { NextPage } from "next";

export type ButtonType = {
  className?: string;
  property1?: string;
};

const Button: NextPage<ButtonType> = ({
  className = "",
  property1 = "Default",
}) => {
  return (
    <button
      className={`cursor-pointer [border:none] py-2.5 pl-2.5 pr-3 bg-[transparent] rounded-lg [background:linear-gradient(90deg,_#ca285e,_#9c1f49)] flex flex-row items-start justify-start ${className}`}
      role="slide to next"
      data-property1={property1}
    >
      <b className="relative text-base font-[Pretendard] text-[#fff] text-left">
        NEXT
      </b>
    </button>
  );
};

export default Button;
