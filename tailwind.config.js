/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#090d16',
          secondary: '#0f172a',
          card: 'rgba(30, 41, 59, 0.7)',
          hover: 'rgba(30, 41, 59, 0.95)',
          input: '#1e293b',
          modal: '#0f172a',
        },
        primary: {
          DEFAULT: '#0ea5e9',
          glow: 'rgba(14, 165, 233, 0.25)',
          dark: '#0284c7',
        },
        accent: {
          cyan: '#0ea5e9',
          blue: '#3b82f6',
          emerald: '#10b981',
          amber: '#f59e0b',
          rose: '#f43f5e',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
        glow: '0 0 25px rgba(14, 165, 233, 0.15)',
        modal: '0 25px 60px -15px rgba(0, 0, 0, 0.85)',
      }
    },
  },
  plugins: [],
}
