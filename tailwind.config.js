/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#10B981',
          600: '#059669',
          700: '#0F766E', // Primary accent
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        // Rich Midnight / Obsidian Slate tailored for modern fintech dark mode (inspired by Vev & Linear)
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#26344E', // Crisp border & divider in dark
          800: '#131C30', // Elevated card surface in dark
          850: '#0E1626', // Mid-layer surface
          900: '#0A0F1D', // Deep obsidian card base in dark
          950: '#060911', // Deepest background canvas
        },
      },
      boxShadow: {
        'glow-emerald': '0 0 16px -2px rgba(16, 185, 129, 0.35)',
        'glow-teal': '0 0 16px -2px rgba(20, 184, 166, 0.35)',
        'glow-amber': '0 0 16px -2px rgba(245, 158, 11, 0.35)',
        'glow-rose': '0 0 16px -2px rgba(244, 63, 94, 0.35)',
        'glow-cyan': '0 0 16px -2px rgba(6, 182, 212, 0.35)',
        'dark-card': '0 4px 24px -2px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.07)',
        'dark-card-hover': '0 10px 32px -4px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(20, 184, 166, 0.35)',
      },
    },
  },
  plugins: [],
};
