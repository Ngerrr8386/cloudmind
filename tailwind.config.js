/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary "knowledge" accent — calm indigo
        ink: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        grape: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
        candy: { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
        mint: { 400: '#34d399', 500: '#10b981', 600: '#059669' },
        sky2: { 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        sun: { 400: '#fbbf24', 500: '#f59e0b' },
        // App surfaces (light-first)
        surface: {
          0: '#f5f6fb', // app background (soft cool paper)
          1: '#ffffff', // cards
          2: '#ffffff',
          3: '#f8f9fd',
          4: '#eef0f7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        // One restrained brand gradient — reserved for the logo & primary CTA
        'gradient-brand': 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'gradient-mint': 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
        'gradient-sun': 'linear-gradient(135deg, #f59e0b 0%, #f43f5e 100%)',
        'gradient-aurora': 'linear-gradient(120deg, #6366f1, #8b5cf6, #0ea5e9)',
        // Very faint tinted wash for hero backdrops
        'mesh': 'radial-gradient(at 0% 0%, rgba(99,102,241,0.10) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(139,92,246,0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(14,165,233,0.08) 0px, transparent 50%)',
      },
      boxShadow: {
        // Soft, paper-like elevation — no neon glows
        glow: '0 10px 30px -12px rgba(79,70,229,0.28)',
        'glow-pink': '0 10px 30px -12px rgba(225,29,72,0.22)',
        'glow-mint': '0 10px 30px -12px rgba(5,150,105,0.22)',
        card: '0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -14px rgba(16,24,40,0.12)',
        soft: '0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-12px)' } },
        'float-slow': { '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' }, '50%': { transform: 'translateY(-18px) rotate(4deg)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': { '0%': { transform: 'scale(0.8)', opacity: '0.4' }, '100%': { transform: 'scale(2.2)', opacity: '0' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'spin-slow': { '100%': { transform: 'rotate(360deg)' } },
        blink: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
      },
      animation: {
        'gradient-x': 'gradient-x 6s ease infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'pulse-ring': 'pulse-ring 2.5s cubic-bezier(0.2,0.8,0.2,1) infinite',
        marquee: 'marquee 28s linear infinite',
        'spin-slow': 'spin-slow 14s linear infinite',
        blink: 'blink 1.1s step-end infinite',
      },
    },
  },
  plugins: [],
}
