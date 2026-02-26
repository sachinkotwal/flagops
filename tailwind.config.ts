import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['DM Sans', 'sans-serif'],
        headline: ['DM Sans', 'sans-serif'],
        code: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#0c0e14',
        foreground: '#ffffff',
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.03)',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: '#161922',
          foreground: '#ffffff',
        },
        primary: {
          DEFAULT: '#60a0ff',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#b080ff',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          foreground: 'rgba(255, 255, 255, 0.45)',
        },
        accent: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ff6b6b',
          foreground: '#ffffff',
        },
        success: '#50dc78',
        warning: '#f0c040',
        border: 'rgba(255, 255, 255, 0.06)',
        input: 'rgba(255, 255, 255, 0.05)',
        ring: '#60a0ff',
      },
      borderRadius: {
        lg: '16px',
        md: '10px',
        sm: '6px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
