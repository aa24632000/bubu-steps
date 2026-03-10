/** @type {import('tailwindcss').Config} */
export default {
  // 這是最關鍵的地圖，確保 Tailwind 能掃描到 src 資料夾裡面的 App.jsx
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}