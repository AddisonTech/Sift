/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#141414',
        card: '#1C1C1C',
        border: '#2A2A2A',
        primary: '#6C47FF',
        accent: '#00D1FF',
        success: '#00E676',
        warning: '#FFB300',
        danger: '#FF3D71',
        text: '#FFFFFF',
        muted: '#9E9E9E',
      },
    },
  },
  plugins: [],
};
