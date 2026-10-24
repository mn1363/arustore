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
        sans: ['"Arad FD"', 'Inter', 'system-ui', 'sans-serif'],
        editorial: ['"Estedad FD"', '"Arad FD"', '"Cormorant Garamond"', 'sans-serif'],
        display: ['"Estedad FD"', '"Arad FD"', '"Cormorant Garamond"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        obsidian: {
          950: '#11100e',
          900: '#171512',
          800: '#211e1a',
          700: '#2e2923',
        },
        travertine: {
          50: '#f7f4ee',
          100: '#ece6dc',
          200: '#dfd6c7',
          800: '#3a352f',
          900: '#171512',
        },
        bronze: {
          300: '#dfc08e',
          400: '#c59b5f',
          500: '#a87e43',
          600: '#8a6430',
        },
        aluminum: {
          100: '#eef0f3',
          200: '#d8dce0',
          300: '#b8bec6',
          400: '#8e96a0',
        },
        primary: '#11100e',
        accent: '#c59b5f',
      },
      animation: {
        'float-slow': 'floatSlow 7s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 5s ease-in-out infinite',
        'spin-slow': 'spin 24s linear infinite',
      },
      keyframes: {
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.75', transform: 'scale(1.04)' },
        },
      },
      boxShadow: {
        'neon-cyan': '0 14px 34px -10px rgba(197, 155, 95, 0.28)',
        'neon-violet': '0 14px 34px -10px rgba(216, 220, 224, 0.2)',
        'glass-3d':
          '0 26px 60px -20px rgba(0, 0, 0, 0.82), inset 0 1px 0 0 rgba(236, 230, 220, 0.1)',
        plinth: '0 22px 45px -22px rgba(23, 21, 18, 0.22)',
      },
    },
  },
  plugins: [],
}
