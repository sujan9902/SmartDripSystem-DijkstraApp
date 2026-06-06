/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-flow': 'pulse-flow 0.6s linear infinite',
      },
    },
  },
  plugins: [],
}
