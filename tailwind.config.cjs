/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './public/index.html', './public/admin.html'],
  theme: {
    extend: {
      colors: {
        ink: '#F3F7F4',
        panel: '#FFFFFF',
        panel2: '#E6F0EC',
        line: '#C7D8D1',
        night: '#163B3A',
        night2: '#0D2928',
        gold: { 300: '#E5A84B', 400: '#D88A32', 500: '#B9652B', 600: '#8F4522' },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
