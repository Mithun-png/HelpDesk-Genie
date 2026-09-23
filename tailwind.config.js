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
        coral: {
          DEFAULT: '#EF4623',
          50: '#FDF1EE',
          100: '#FCE1DA',
          200: '#FAC3B5',
          300: '#F69982',
          400: '#F26F4F',
          500: '#EF4623',
          600: '#D93816',
          700: '#B52B0E',
          800: '#92230D',
          900: '#771F0E',
          accent: '#EF4623',
          glow: 'rgba(239, 70, 35, 0.25)',
        },
        ink: {
          DEFAULT: '#2D3B42',
          50: '#F5F7F8',
          100: '#E4E9EC',
          200: '#C9D3D8',
          300: '#A1B2BC',
          400: '#738B99',
          500: '#556E7C',
          600: '#425763',
          700: '#374852',
          800: '#2D3B42',
          900: '#1F292E',
          950: '#131B1F',
        },
        peach: {
          DEFAULT: '#FDF1EE',
          50: '#FFFAF8',
          100: '#FDF1EE',
          200: '#F9DDD4',
          300: '#F4C5B7',
        },
        primary: {
          DEFAULT: '#EF4623',
          50: '#FDF1EE',
          100: '#FCE1DA',
          500: '#EF4623',
          600: '#D93816',
          700: '#B52B0E',
        },
        secondary: {
          DEFAULT: '#2D3B42',
          800: '#2D3B42',
          900: '#1F292E',
        },
        background: {
          peach: '#FDF1EE',
          dark: '#131B1F',
          'dark-card': '#1F292E',
          'dark-surface': '#2D3B42',
          light: '#FDF1EE',
          'light-card': '#FFFFFF',
          'light-surface': '#FAF0ED',
        },
        genie: {
          50: '#FDF1EE',
          100: '#FCE1DA',
          200: '#FAC3B5',
          300: '#F69982',
          400: '#F26F4F',
          500: '#EF4623',
          600: '#D93816',
          700: '#B52B0E',
          800: '#92230D',
          900: '#771F0E',
          accent: '#EF4623',
          glow: 'rgba(239, 70, 35, 0.25)',
        }
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Manrope"', 'system-ui', 'sans-serif'],
        manrope: ['"Manrope"', 'system-ui', 'sans-serif'],
        instrument: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      borderRadius: {
        '30px': '30px',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'primary-lg': '0 10px 25px -3px rgba(239, 70, 35, 0.20)',
        'coral-sm': '0 0 15px rgba(239, 70, 35, 0.2)',
        'coral-md': '0 0 25px rgba(239, 70, 35, 0.35)',
        'coral-lg': '0 10px 30px -3px rgba(239, 70, 35, 0.25)',
        'glass-card': '0 8px 32px 0 rgba(45, 59, 66, 0.08)',
        'glass-coral': '0 8px 32px 0 rgba(239, 70, 35, 0.15)',
        'glass-violet': '0 8px 32px 0 rgba(239, 70, 35, 0.15)',
        'glass-violet-lg': '0 12px 40px 0 rgba(239, 70, 35, 0.25)',
        'glow-sm': '0 0 15px rgba(239, 70, 35, 0.25)',
        'glow-md': '0 0 25px rgba(239, 70, 35, 0.35)',
        'glow-lg': '0 0 45px rgba(239, 70, 35, 0.5)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px) rotate(2deg)' },
          '100%': { opacity: '1', transform: 'translateY(0) rotate(0deg)' },
        },
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
