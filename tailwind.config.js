/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#A9201F",
        brandSoft: "#FCEAEA",
        ink: "#1F2421",
        inkSoft: "#6B7269",
      },
    },
  },
  plugins: [],
};
