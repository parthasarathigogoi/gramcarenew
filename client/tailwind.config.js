/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#10B981",
        danger: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
        info: "#3B82F6",
      },
      fontSize: {
        'base-large': '18px',
      }
    },
  },
  plugins: [],
}

