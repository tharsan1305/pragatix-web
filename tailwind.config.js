/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Times New Roman'", 'Times', 'serif'],
        body: ["'Inter'", 'sans-serif'],
      },
    },
  },
  plugins: [],
}
