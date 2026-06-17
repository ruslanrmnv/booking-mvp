import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory:    "#FAF6F0",
        espresso: "#2B1D14",
        amber: {
          // DEFAULT overrides `bg-amber`/`text-amber` etc.
          // Individual shades (amber-50…950) come from Tailwind's built-in palette.
          DEFAULT: "#9C5A1B",
        },
        oxblood:  "#6B2D2D",
        walnut:   "#8A6A4B",
        sand:     "#E8DBC4",
      },
      fontFamily: {
        // Single typeface across the entire site — Inter, loaded via next/font.
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
