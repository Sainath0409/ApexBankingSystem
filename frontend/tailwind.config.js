/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38aaf6',
          500: '#0e8fe6',
          600: '#0271c4',
          700: '#035a9f',
          800: '#074c82',
          900: '#0c406c',
          950: '#082949',
        },
        accent: {
          500: '#10b981',
          600: '#059669',
        }
      }
    },
  },
  plugins: [],
}
