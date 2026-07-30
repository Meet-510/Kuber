/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── "Paper" palette ───────────────────────────────────────────────
        // The app was authored dark-first (high gray = background, low gray =
        // text). We remap the whole scale to a warm, light, editorial theme so
        // existing utility classes flip to Paper without touching every file.
        // Roles by usage, not a strict light→dark ramp:
        gray: {
          50: '#111010',
          100: '#1a1915', // primary headings
          200: '#2c2a25', // strong body text
          300: '#3d3a34', // medium text
          400: '#5a574f', // labels / secondary-strong
          500: '#6e6b62', // secondary text
          600: '#837f75', // faint hints / muted icons / placeholders
          700: '#d6d1c5', // strong border / control fill
          800: '#e7e3d9', // hairline border / subtle fill / hover
          900: '#fbfaf6', // card / panel / sidebar surface
          950: '#f2f0e9', // page canvas (warm paper)
        },
        // Single forest-green accent — purple/blue/indigo/emerald all fold into
        // it so the UI reads as one restrained accent on paper.
        purple: {
          200: '#a9c7b5',
          300: '#2c7a52',
          400: '#1f6b44',
          500: '#256b44',
          600: '#1f5c3d',
          700: '#184a31',
        },
        blue: {
          400: '#1f6b44',
          500: '#256b44',
          600: '#1f5c3d',
        },
        emerald: {
          400: '#1f6b44',
          500: '#1f5c3d',
        },
        // Pending / warning → warm ochre
        amber: {
          400: '#8a6011',
          500: '#b07a16',
        },
        // Sent / danger → muted brick
        red: {
          400: '#a23b34',
          500: '#b4453c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 27, 23, 0.04)',
      },
    },
  },
  plugins: [],
};
