/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'aquamarine': '#7FFFD4',
        'aquamarine-dark': '#4DB6AC',
        'light-aquamarine': '#E0F7FA',
      }
    },
  },
  plugins: [],
}

