/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ['./App.tsx', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1976d2', // blue
          light: '#63a4ff',
          dark: '#004ba0',
        },
        accent: {
          DEFAULT: '#2196F3', // blue accent
        },
        background: {
          DEFAULT: '#F8FAFC',
        },
        surface: {
          DEFAULT: '#fff',
        },
        muted: {
          DEFAULT: '#e3f2fd',
        },
        danger: {
          DEFAULT: '#e53935',
        },
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [],
};
