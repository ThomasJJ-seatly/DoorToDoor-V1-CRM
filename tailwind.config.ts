import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#FAF9F7",
          secondary: "#F4F2EE",
          elevated: "#FFFFFF",
          inverse: "#1A1A18",
        },
        text: {
          primary: "#1A1A18",
          secondary: "#6B6B67",
          tertiary: "#9C9B96",
          inverse: "#FAF9F7",
          accent: "#1A5F5A",
        },
        accent: {
          DEFAULT: "#1A5F5A",
          hover: "#154D49",
          active: "#0F3D3A",
          light: "#E8F4F3",
          border: "#B8DCD8",
        },
        border: {
          subtle: "#EDEBE7",
          DEFAULT: "#E5E4E0",
          strong: "#D5D3CD",
        },
        status: {
          success: "#2D7A3F",
          successBg: "#E8F3EA",
          warning: "#C97A1A",
          warningBg: "#FBF1E2",
          danger: "#A8362F",
          dangerBg: "#F7E5E3",
          info: "#1A5F5A",
          infoBg: "#E8F4F3",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
