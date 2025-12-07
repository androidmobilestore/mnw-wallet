/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        moneteum: {
          DEFAULT: '#00C48C',
          light: '#E6F9F4',
          dark: '#008C60',
        },
      },
    },
  },
  plugins: [],
}