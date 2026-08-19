/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        spidy: {
          red: '#E50914',
          crimson: '#FF1E27',
          darkred: '#8B0000',
          dark: '#0B0B0E',
          surface: '#121217',
          card: '#181820',
          border: 'rgba(229, 9, 20, 0.25)',
          glow: 'rgba(255, 30, 39, 0.5)',
        }
      },
      backgroundImage: {
        'spider-grid': "radial-gradient(circle, rgba(229, 9, 20, 0.08) 1px, transparent 1px)",
        'hero-gradient': "radial-gradient(circle at top center, rgba(229,9,20,0.18) 0%, rgba(11,11,14,0.95) 70%)",
        'red-glass': "linear-gradient(135deg, rgba(229, 9, 20, 0.12) 0%, rgba(20, 20, 27, 0.7) 100%)",
      },
      boxShadow: {
        'spidy-glow': '0 0 25px -5px rgba(229, 9, 20, 0.4)',
        'spidy-border': '0 0 0 1px rgba(229, 9, 20, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'web-spin': 'spin 20s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px 0px rgba(229, 9, 20, 0.3)' },
          '50%': { boxShadow: '0 0 30px 8px rgba(229, 9, 20, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
