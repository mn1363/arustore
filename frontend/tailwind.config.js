/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Shabnam FD"', 'Inter', 'system-ui', 'sans-serif'],
        editorial: ['"Shabnam FD"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Shabnam FD"', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        obsidian: {
          950: '#08090f',
          900: '#10131c',
          800: '#161a26',
          700: '#1f2536',
        },
        champagne: {
          100: '#f5ead6',
          200: '#ead7b7',
          300: '#dfc08e',
          400: '#c4a06a',
        },
        aether: {
          300: '#9ec0f0',
          400: '#7ea6e0',
          500: '#5882c4',
        },
        primary: '#08090f',
        accent: '#dfc08e',
      },
      boxShadow: {
        'depth-1':
          '0 14px 34px -16px rgba(0, 0, 0, 0.72), inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
        'depth-2':
          '0 22px 48px -18px rgba(0, 0, 0, 0.82), 0 6px 16px -6px rgba(0, 0, 0, 0.55), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'depth-3':
          '0 28px 60px -18px rgba(0, 0, 0, 0.88), 0 0 28px -8px rgba(223, 192, 142, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.14)',
        'depth-hero':
          '0 36px 80px -24px rgba(0, 0, 0, 0.92), 0 0 54px -14px rgba(126, 166, 224, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
        'neon-cyan': '0 14px 34px -10px rgba(223, 192, 142, 0.28)',
        'neon-violet': '0 14px 34px -10px rgba(126, 166, 224, 0.22)',
        'glass-3d': '0 24px 56px -20px rgba(0, 0, 0, 0.82)',
        soft: '0 18px 42px -18px rgba(0, 0, 0, 0.68)',
      },
      keyframes: {
        'float-gentle': {
          '0%, 100%': { transform: 'translate3d(0, 0px, 0)' },
          '50%': { transform: 'translate3d(0, -7px, 0)' },
        },
        'pulse-aura': {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.72', transform: 'scale(1.04)' },
        },
        'modal-enter': {
          '0%': { opacity: '0', transform: 'translate3d(0, 10px, 0) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0) scale(1)' },
        },
      },
      animation: {
        'float-slow': 'float-gentle 7s ease-in-out infinite',
        'pulse-aura': 'pulse-aura 9s ease-in-out infinite',
        'modal-enter': 'modal-enter 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
}
