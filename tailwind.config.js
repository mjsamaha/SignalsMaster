/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/index.html",
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // ===== NAVAL LIGHT THEME COLOR SYSTEM =====
      colors: {
        // PRIMARY PALETTE - Modern Light Naval Theme
        'naval-blue': {
          DEFAULT: '#0A2A43',   // PRIMARY: Naval blue (headers, buttons, text)
          light: '#1a3a53',     // Lighter variant
          hover: '#08223a',     // Hover state
          active: '#061a2f',    // Active state
        },
        'steel-gray': {
          DEFAULT: '#6E829B',   // SECONDARY: Steel gray (tabs, secondary elements)
          light: '#8a9db3',     // Lighter variant
          hover: '#5d7089',     // Hover state
          active: '#4d5f77',    // Active state
        },
        'signal-yellow': {
          DEFAULT: '#F4D35E',   // ACCENT: Signal yellow (CTAs, highlights)
          light: '#f6dc7e',     // Lighter variant
          hover: '#f2ca47',     // Hover state
          active: '#f0c130',    // Active state
        },
        'background': {
          light: '#F5F7FA',     // PRIMARY: Light background (off-white)
          white: '#FFFFFF',     // Pure white for cards/overlays
        },
        'success': {
          DEFAULT: '#2ECC71',   // Correct answers, confirmations (military green)
          light: 'rgba(46, 204, 113, 0.1)',
          hover: '#27ae60',
        },
        'error': {
          DEFAULT: '#E74C3C',   // Incorrect answers, warnings (alert red)
          light: 'rgba(231, 76, 60, 0.1)',
          hover: '#c0392b',
        },
        'gray': {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
      },
      // Typography scale
      fontSize: {
        // Mobile-first (16px base)
        'xs': ['12px', { lineHeight: '16px', letterSpacing: '0.5px' }],
        'sm': ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
        'base': ['16px', { lineHeight: '24px' }],
        'lg': ['18px', { lineHeight: '28px' }],
        'xl': ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        // Desktop sizes (using @apply or variants)
        '3xl': ['28px', { lineHeight: '36px', fontWeight: '700' }],
        '4xl': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        '5xl': ['36px', { lineHeight: '44px', fontWeight: '700' }],
        '6xl': ['40px', { lineHeight: '48px', fontWeight: '700' }],
      },
      // Spacing scale (8px base unit)
      spacing: {
        'safe': 'max(0px, env(safe-area-inset-left))',
      },
      // Shadow definitions (subtle, refined)
      boxShadow: {
        'light': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'sm': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'md': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'lg': '0 8px 16px rgba(0, 0, 0, 0.12)',
        'gold': '0 4px 12px rgba(212, 175, 55, 0.2)',
        'inner-sm': 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      // Border radius
      borderRadius: {
        'button': '8px',
        'card': '12px',
      },
      // Animation
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(10px)', opacity: '0' },
        },
        bounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.08)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'fade-out': 'fadeOut 0.2s ease-out forwards',
        'slide-up': 'slideInUp 0.3s ease-in-out',
        'slide-down': 'slideOutDown 0.3s ease-in-out',
        'bounce-feedback': 'bounce 0.2s ease-out forwards',
        'shake-feedback': 'shake 0.15s ease-in-out forwards',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      // Responsive typography
      screens: {
        'xs': '320px',
        'sm': '375px',   // Primary mobile target
        'md': '600px',   // Tablet start
        'lg': '768px',   // Tablet optimized
        'xl': '1024px',  // Desktop start
        '2xl': '1200px', // Full desktop
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

