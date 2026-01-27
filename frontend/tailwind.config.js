/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'ibm-plex': ['IBM Plex Sans Arabic', 'Tajawal', 'Noto Kufi Arabic', 'sans-serif'],
        'arabic': ['IBM Plex Sans Arabic', 'Tajawal', 'Noto Kufi Arabic', 'sans-serif'],
        'aws-pro': ['IBM Plex Sans Arabic', 'Tajawal', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'aws-pro-mono': ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', 'monospace'],
        'sans': ['IBM Plex Sans Arabic', 'Tajawal', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Monaco', 'Cascadia Code', 'Segoe UI Mono', 'Roboto Mono', 'monospace'],
      },
      direction: {
        'rtl': 'rtl',
        'ltr': 'ltr',
      },
      colors: {
        primary: {
          50: '#f7f0ff',
          100: '#eedcff',
          200: '#dfbfff',
          300: '#cfa1ff',
          400: '#be82ff',
          500: '#ad63f4',
          600: '#9850d9',
          700: '#7d3fb0',
          800: '#5f2f84',
          900: '#45235f',
        },
        accent: {
          50: '#ecf7ff',
          100: '#d7eeff',
          200: '#b4dcff',
          300: '#8cc8ff',
          400: '#62b1ff',
          500: '#3f98f2',
          600: '#2c7fd8',
          700: '#2466ad',
          800: '#1d4e85',
          900: '#15375f',
        },
        medical: {
          50: '#eefbf4',
          100: '#d7f5e6',
          200: '#b1ebd1',
          300: '#86dfb9',
          400: '#5fd19e',
          500: '#3fc183',
          600: '#2ea56e',
          700: '#24845a',
          800: '#1d6446',
          900: '#184f38',
        },
        danger: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
};