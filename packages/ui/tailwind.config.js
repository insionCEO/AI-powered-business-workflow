/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-dark': '#1E1E1F',
        'custom-darker': '#1B1B1C',
        'custom-lighter': '#232324',
      },
      backgroundImage: {
        'subtle-gradient': 'linear-gradient(to bottom, #232324, #1E1E1F, #1B1B1C)',
        'app-dark-gradient': 'linear-gradient(0deg, hsl(180deg 9.33% 12.39%) 0%, hsl(0deg 0% 10.39%) 100%)',
        'dark-zinc-to-sky': 'linear-gradient(16deg, rgba(9,9,11,1) 0%, rgba(0,212,255,0.05) 100%)',
      }
    }
  },
  plugins: [],
}