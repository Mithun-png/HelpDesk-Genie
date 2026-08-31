/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          dark: '#09080E',
          'dark-card': '#12101E',
          'dark-surface': '#19152B',
          light: '#F8FAFC',
          'light-card': '#FFFFFF',
          'light-surface': '#F1F5F9',
        },
        genie: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#A855F7',
          600: '#9333EA',
          700: '#7E22CE',
          800: '#6B21A8',
          900: '#581C87',
          950: '#3B0764',
          accent: '#8B5CF6',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
        slate: {
          850: '#151b28',
          950: '#070b12',
        }
      },
      boxShadow: {
        'glass-violet': '0 8px 32px 0 rgba(139, 92, 246, 0.15)',
        'glass-violet-lg': '0 12px 40px 0 rgba(139, 92, 246, 0.25)',
        'glass-card': '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
        'glow-sm': '0 0 15px rgba(139, 92, 246, 0.3)',
        'glow-md': '0 0 25px rgba(139, 92, 246, 0.45)',
        'glow-lg': '0 0 45px rgba(139, 92, 246, 0.6)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
