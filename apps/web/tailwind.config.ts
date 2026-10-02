/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        hospital: {
          primary: '#0f4c81',
          surface: '#f8fafc',
          ink: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
