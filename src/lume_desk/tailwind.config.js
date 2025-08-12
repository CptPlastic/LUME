/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'lume-primary': '#FF6B35',
        'lume-secondary': '#004E89', 
        'lume-accent': '#FFD23F',
        'lume-danger': '#E63946',
        'lume-success': '#06D6A0',
        'lume-dark': '#1A1A1A',
        'lume-light': '#F8F9FA'
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms')
  ],
}
