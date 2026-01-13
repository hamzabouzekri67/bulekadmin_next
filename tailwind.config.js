/** @type {import('tailwindcss').Config} */
import scrollbar from "tailwind-scrollbar";

const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    scrollbar,
  ],
};

export default config;
