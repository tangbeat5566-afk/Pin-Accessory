/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        canvas: {
          soft: "#f8f4f6"
        }
      }
    }
  },
  plugins: []
};
