const { colors } = require('./src/theme/colors');
const { fonts } = require('./src/theme/fonts');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors,
      fontFamily: fonts,
    },
  },
  plugins: [],
};
