/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Defined as RGB so NativeWind can construct opacity variants
        // (e.g. bg-primary/10, text-danger/50) correctly on both web and native.
        background: 'rgb(10 10 10)',
        surface:    'rgb(20 20 20)',
        card:       'rgb(28 28 28)',
        border:     'rgb(42 42 42)',
        primary:    'rgb(108 71 255)',
        accent:     'rgb(0 209 255)',
        success:    'rgb(0 230 118)',
        warning:    'rgb(255 179 0)',
        danger:     'rgb(255 61 113)',
        text:       'rgb(255 255 255)',
        muted:      'rgb(158 158 158)',
      },
    },
  },
  plugins: [],
};
