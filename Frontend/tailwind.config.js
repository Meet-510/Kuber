/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Editorial Light palette ─────────────────────────────────────
        // Named tokens — use these on new work.
        paper: {
          DEFAULT: '#faf9f6',
          2: '#f2f1ec',
          3: '#ebeae4',
        },
        ink: {
          DEFAULT: '#0d0d0d',
          2: '#1f1f1f',
          3: '#4a4a4a',
          4: '#6b6b6b',
          5: '#9a9a94',
        },
        line: {
          DEFAULT: '#e4e2dc',
          2: '#d4d2ca',
        },
        accent: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          tint: '#eef2ff',
        },

        // ── Legacy `gray-*` remap ──────────────────────────────────────
        // Existing components use `bg-gray-950` for canvas, `text-gray-100`
        // for headings, etc. We map that scale onto the Editorial Light
        // tokens so utility classes keep working without touching every
        // file. Roles here are by USAGE, not a strict light→dark ramp.
        gray: {
          50:  '#0d0d0d', // extreme ink
          100: '#0d0d0d', // primary headings (ink)
          200: '#1f1f1f', // strong body text (ink-2)
          300: '#1f1f1f', // medium text
          400: '#4a4a4a', // body text (ink-3)
          500: '#6b6b6b', // meta (ink-4)
          600: '#9a9a94', // muted / placeholder (ink-5)
          700: '#d4d2ca', // strong border (line-2)
          800: '#e4e2dc', // hairline border (line)
          900: '#f2f1ec', // subtle surface (paper-2)
          950: '#faf9f6', // page canvas (paper)
        },

        // Legacy accent aliases — every purple/blue/emerald in the old
        // code folds into the single indigo accent so the UI reads as
        // one restrained hue.
        purple: {
          200: '#eef2ff',
          300: '#a5b4fc',
          400: '#6366f1',
          500: '#4f46e5',
          600: '#4f46e5',
          700: '#4338ca',
        },
        blue: {
          400: '#6366f1',
          500: '#4f46e5',
          600: '#4338ca',
        },
        emerald: {
          400: '#1f6b44', // kept muted green for +amount readability
          500: '#1f5c3d',
        },
        // Pending / warning — warm ochre
        amber: {
          400: '#8a6011',
          500: '#b07a16',
        },
        // Sent / danger — muted brick
        red: {
          400: '#a23b34',
          500: '#b4453c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        serif: ['"Instrument Serif"', '"Iowan Old Style"', 'Georgia', 'ui-serif', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      // No box shadows in the editorial system; keep the token defined but
      // as a no-op so any lingering `shadow-card` classes don't render a lift.
      boxShadow: {
        card: '0 0 0 0 transparent',
      },
    },
  },
  plugins: [],
};
