import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['var(--font-pretendard)', 'sans-serif'],
      },
      colors: {
        banner: {
          start: "#212529",
          end: "#460E06",
        },
        primary: {
          DEFAULT: "#FFB310",
          hover: "#EAA000",
        },
        Sub: "#FFB310", // 주황색/노란색
        gray0: "#F8F9FA",
        gray2: "#CED4DA", 
        gray4: "#ADB5BD",
        gray5: "#868E96",
        gray6: "#495057",
      },
      backgroundImage: {
        "banner-gradient": "linear-gradient(to right, #212529, #460E06)",
      },
      screens: {
        'xs': '280px', // 갤럭시 Z 폴드 5 폴드 상태
        'sm': '400px', // 갤럭시 Z 폴드 5 펼친 상태 근처
        'md': '768px', // 기존 태블릿
        'lg': '1024px', // 기존 데스크톱
        'xl': '1280px', // 기존 대형 데스크톱
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@tailwindcss/line-clamp'),
  ],
};

export default config;