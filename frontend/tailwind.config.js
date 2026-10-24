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
        sans: ['Vazirmatn', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Vazirmatn', 'sans-serif'],
      },
      colors: {
        obsidian: {
          950: '#07080c',
          900: '#0c0e15',
          800: '#141824',
          700: '#1f2536',
        },
        primary: '#07080c',
        accent: '#f59e0b',
      },
      animation: {
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'spin-slow': 'spin 18s linear infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.06)' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 32px -6px rgba(245, 158, 11, 0.42)',
        'neon-violet': '0 0 32px -6px rgba(226, 232, 240, 0.35)',
        'glass-3d':
          '0 24px 60px -15px rgba(0, 0, 0, 0.78), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)',
      },
    },
  },
  plugins: [],
}
