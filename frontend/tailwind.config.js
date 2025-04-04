/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#36a9f7',
          500: '#0c8ce9',
          600: '#0069c2',
          700: '#00539c',
          800: '#00427d',
          900: '#003566',
        },
        secondary: {
          50: '#f5f7fa',
          100: '#e9edf2',
          200: '#d0d8e2',
          300: '#a7b8c9',
          400: '#7893ab',
          500: '#5a768f',
          600: '#475d73',
          700: '#3a4a5c',
          800: '#313d4b',
          900: '#2b3440',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 