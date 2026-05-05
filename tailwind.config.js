/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        magical: {
          navy: '#0a0a1a',
          gold: '#d4af37',
          purple: '#6a0dad',
          parchment: '#f4e4bc',
        }
      },
      backgroundImage: {
        'magical-gradient': 'radial-gradient(circle at center, var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}
