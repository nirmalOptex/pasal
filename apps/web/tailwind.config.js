/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chiya: {
          50: '#fdf8f4',
          100: '#faefe6',
          200: '#f4decb',
          300: '#eac6a6',
          400: '#dda57a',
          500: '#d08655',
          600: '#c16c41',
          700: '#a15336',
          800: '#834431',
          900: '#6b392b',
          950: '#391c14',
        },
      },
    },
  },
  plugins: [],
};
