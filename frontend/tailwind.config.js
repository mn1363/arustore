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
          950: '#0d0e11',
          900: '#14161a',
          800: '#1b1e24',
          700: '#262a33',
        },
        champagne: {
          200: '#ead7b7',
          300: '#d6b88a',
          400: '#c29f6d',
        },
        primary: '#0d0e11',
        accent: '#d6b88a',
      },
      boxShadow: {
        'neon-cyan': '0 10px 30px -10px rgba(214, 184, 138, 0.22)',
        'neon-violet': '0 10px 30px -10px rgba(255, 255, 255, 0.12)',
        'glass-3d': '0 20px 50px -20px rgba(0, 0, 0, 0.7)',
        soft: '0 16px 40px -18px rgba(0, 0, 0, 0.55)',
      },
    },
  },
  plugins: [],
}
