/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/index.html",
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      // ===== UNIFIED MODERN NAVAL COLOR SYSTEM =====
      colors: {
        // PRIMARY PALETTE - Use EVERYWHERE for consistency
        'navy': {
          50: '#f0f6fa',    // Lightest variant
          100: '#e0eefb',
          300: '#7fa4c8',
          500: '#0a3961',   // PRIMARY: Navy blue (buttons, text, headers)
          600: '#082d4f',   // Hover state
          700: '#061d38',   // Active state
          900: '#001428',   // Darkest
        },
        'sky': {
          50: '#f0f6fa',    // PRIMARY: Light sky (main background)
          100: '#e8f4f8',
          200: '#d0e8f2',
        },
        'gold': {
          50: '#fffbf0',
          200: '#fce8c3',
          400: '#f4d27f',
          500: '#d4af37',   // PRIMARY: Gold (CTA buttons, highlights)
          600: '#c9a932',   // Hover state
          700: '#b8952a',   // Active state
        },
        'success': {
          500: '#22c55e',   // Correct answers, success states
          600: '#16a34a',
        },
        'error': {
          500: '#ef4444',   // Incorrect answers, errors
          600: '#dc2626',
        },
        'gray': {
          50: '#f1f5f9',    // Light (inputs, disabled)
          100: '#e2e8f0',   // Border gray
          200: '#cbd5e1',
          600: '#64748b',   // Neutral (secondary text)
          700: '#475569',
          900: '#0f172a',
        },
        'white': '#ffffff',
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

