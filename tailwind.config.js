/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'rgb(10 10 10 / <alpha-value>)',
        surface:    'rgb(20 20 20 / <alpha-value>)',
        card:       'rgb(28 28 28 / <alpha-value>)',
        border:     'rgb(42 42 42 / <alpha-value>)',
        primary:    'rgb(108 71 255 / <alpha-value>)',
        accent:     'rgb(0 209 255 / <alpha-value>)',
        success:    'rgb(0 230 118 / <alpha-value>)',
        warning:    'rgb(255 179 0 / <alpha-value>)',
        danger:     'rgb(255 61 113 / <alpha-value>)',
        text:       'rgb(255 255 255 / <alpha-value>)',
        muted:      'rgb(158 158 158 / <alpha-value>)',
        subtle:     'rgb(85 85 85 / <alpha-value>)',
        placeholder:'rgb(48 48 48 / <alpha-value>)',
      },
    },
  },
  plugins: [],
};
