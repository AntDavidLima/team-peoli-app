const colors = require("./tailwind.colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.tsx", "./components/**/*.tsx"],
  theme: {
    extend: {
      colors,
    },
  },
  plugins: [],
};
