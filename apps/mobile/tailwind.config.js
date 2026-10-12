const { colors } = require('./src/theme/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Brand tokens: bg-primary, text-foreground, border-border-strong, bg-accent, text-danger-strong…
      // Use these instead of Tailwind's default palette (neutral-500, blue-600…) or hex values.
      colors,
    },
  },
  plugins: [],
};
