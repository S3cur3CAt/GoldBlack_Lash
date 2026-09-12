/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#060608',
          900: '#0a0a0d',
          850: '#101014',
          800: '#16161c',
          700: '#1f1f28',
          600: '#2c2c38',
        },
        gold: {
          50: '#fdfbf2',
          100: '#faf5e1',
          200: '#f4e8bd',
          300: '#ecd591',
          400: '#dfbc60',
          500: '#d4af37', // Primary gold
          600: '#b89228',
          700: '#927020',
          800: '#755820',
          900: '#61491e',
        },
        cream: '#faf8f5',
        muted: '#8e8ea0',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Jost', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(212, 175, 55, 0.25)',
        'gold-glow-lg': '0 0 35px -3px rgba(212, 175, 55, 0.35)',
      },
    },
  },
  plugins: [],
}
