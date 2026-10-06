import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0F14',
        surface: {
          DEFAULT: '#111720',
          secondary: '#161D26',
          elevated: '#1B2430',
        },
        border: {
          DEFAULT: '#26313D',
          subtle: '#1E2733',
        },
        text: {
          primary: '#F3F5F7',
          secondary: '#9AA6B2',
          muted: '#687583',
          faint: '#4A5565',
        },
        accent: {
          DEFAULT: '#19C3A3',
          dim: 'rgba(25, 195, 163, 0.12)',
          border: 'rgba(25, 195, 163, 0.25)',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],    // 11px
        'xs': ['0.75rem', { lineHeight: '1rem' }],       // 12px
        'sm': ['0.8125rem', { lineHeight: '1.25rem' }],  // 13px
        'base': ['0.875rem', { lineHeight: '1.375rem' }],// 14px
        'md': ['0.9375rem', { lineHeight: '1.5rem' }],   // 15px
        'lg': ['1rem', { lineHeight: '1.5rem' }],        // 16px
        'xl': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],       // 24px
        '3xl': ['2rem', { lineHeight: '2.5rem' }],       // 32px
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '10px',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
      },
    },
  },
  plugins: [],
};

export default config;
