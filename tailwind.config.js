/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: '#111111',
        border: '#222222',
        text: '#ffffff',
        'text-secondary': '#a1a1aa',
        primary: '#ffffff',
        'primary-text': '#000000'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
