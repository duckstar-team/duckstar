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
        vote: {
          hover: "#ffd4e2",
        },
      },
      backgroundImage: {
        "banner-gradient": "linear-gradient(to right, #212529, #460E06)",
      },
    },
  },
  plugins: [],
};

export default config;