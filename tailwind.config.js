/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f5fa',
          100: '#dce7f2',
          200: '#b4cde5',
          300: '#83a9d1',
          400: '#5584bc',
          500: '#3a6aa3',
          600: '#2d5485',
          700: '#25446b',
          800: '#1e3a5f',
          900: '#172d4a',
          950: '#0f1e33',
        },
        accent: {
          50: '#fff1f0',
          100: '#ffdcd9',
          200: '#ffbdb8',
          300: '#ff948c',
          400: '#ff6b6b',
          500: '#f94c43',
          600: '#e63329',
          700: '#c2251d',
          800: '#9f221c',
          900: '#82221e',
        },
        speaker: {
          1: '#4ecdc4',
          2: '#ffd93d',
          3: '#6bcb77',
          4: '#b19cd9',
          5: '#ff8c69',
          6: '#74b9ff',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
        'elevated': '0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};
