/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10B981',  // Emerald green (fitness vibe)
        secondary: '#1F2937',
        accent: '#F59E0B',
        'gray-50': '#f9fafb',
        'gray-100': '#f3f4f6',
        'gray-800': '#1f2937',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}