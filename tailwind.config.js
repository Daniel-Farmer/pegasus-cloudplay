/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/src/**/*.{ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        'bg-base':     '#0a0a0f',
        'bg-surface':  '#0f0f1a',
        'bg-elevated': '#14141f',
        'bg-border':   '#1e1e30',
        'accent-purple':   '#7c3aed',
        'accent-purple-l': '#9d5cf6',
        'accent-cyan':     '#06b6d4',
        'accent-cyan-l':   '#22d3ee',
        'text-primary':    '#f1f1f5',
        'text-secondary':  '#9999b3',
        'text-muted':      '#4f4f6e',
        'status-ready':    '#22c55e',
        'status-warn':     '#f59e0b',
        'status-error':    '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '1rem',
        'xl3': '1.25rem',
      },
      boxShadow: {
        'glow-purple':    '0 0 20px 4px rgba(124, 58, 237, 0.45)',
        'glow-purple-lg': '0 0 40px 8px rgba(124, 58, 237, 0.35)',
        'glow-cyan':      '0 0 20px 4px rgba(6, 182, 212, 0.45)',
        'glow-green':     '0 0 10px 2px rgba(34, 197, 94, 0.5)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        'grid-dark': 'linear-gradient(rgba(124,58,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px 4px rgba(124,58,237,0.5)' },
          '50%':      { boxShadow: '0 0 40px 10px rgba(6,182,212,0.5)' },
        },
      },
    },
  },
  plugins: [],
}
