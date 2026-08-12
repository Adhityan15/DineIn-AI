/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--color-bg-app)',
          surface: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-surface-elevated)',
          border: 'var(--color-border)',
          muted: 'var(--color-border-muted)',
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          danger: 'var(--color-danger)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
        neon: {
          green: '#00FF88',
          blue: '#00D9FF',
          purple: '#8B5CF6',
          red: '#FF3366',
          yellow: '#FFE600',
        }
      },
      spacing: {
        'app-8': 'var(--space-8)',
        'app-12': 'var(--space-12)',
        'app-16': 'var(--space-16)',
        'app-20': 'var(--space-20)',
        'app-24': 'var(--space-24)',
        'app-32': 'var(--space-32)',
        'app-40': 'var(--space-40)',
      },
      borderRadius: {
        'app-sm': 'var(--radius-sm)',
        'app-md': 'var(--radius-md)',
        'app-lg': 'var(--radius-lg)',
        'app-xl': 'var(--radius-xl)',
        'app-2xl': 'var(--radius-2xl)',
      },
      boxShadow: {
        'app-sm': 'var(--shadow-sm)',
        'app-md': 'var(--shadow-md)',
        'app-lg': 'var(--shadow-lg)',
        'glow-green': '0 0 12px rgba(0, 255, 136, 0.25)',
        'glow-blue': '0 0 12px rgba(0, 217, 255, 0.25)',
        'glow-purple': '0 0 12px rgba(139, 92, 246, 0.25)',
        'glow-red': '0 0 12px rgba(255, 51, 102, 0.25)',
        'glow-yellow': '0 0 12px rgba(255, 230, 0, 0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
