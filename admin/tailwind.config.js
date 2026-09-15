/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#09090b',
          900: '#0d0d10',
          850: '#131317',
          800: '#1a1a20',
          750: '#232329',
          700: '#2e2e36',
        },
        line: {
          DEFAULT: '#26262e',
          strong: '#34343e',
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
        muted: '#9a9aa6',
        faint: '#64646e',
      },
      fontFamily: {
        serif: ['"SF Pro Rounded"', '-apple-system', 'BlinkMacSystemFont', 'Nunito', 'sans-serif'],
        sans: ['"SF Pro Rounded"', '-apple-system', 'BlinkMacSystemFont', 'Nunito', 'sans-serif'],
        rounded: ['"SF Pro Rounded"', '-apple-system', 'BlinkMacSystemFont', 'Nunito', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0, 0, 0, 0.35)',
        'raised': '0 8px 24px rgba(0, 0, 0, 0.45)',
        'gold-glow': '0 0 0 1px rgba(212, 175, 55, 0.3), 0 4px 16px rgba(212, 175, 55, 0.15)',
        'gold-glow-lg': '0 0 0 1px rgba(212, 175, 55, 0.35), 0 8px 28px rgba(212, 175, 55, 0.22)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        eq: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade': 'fadeIn 150ms ease-out',
        'fade-in': 'fadeIn 150ms ease-out',
        'fadeIn': 'fadeIn 150ms ease-out',
        'fade-in-up': 'fadeInUp 200ms ease-out',
        'fadeInUp': 'fadeInUp 200ms ease-out',
        'scale-up': 'scaleUp 200ms ease-out',
        'scaleUp': 'scaleUp 200ms ease-out',
        'eq': 'eq 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
