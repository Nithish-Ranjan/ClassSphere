/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic Role-Aware Color Palette
        role: {
          primary: 'var(--role-primary)',
          'primary-strong': 'var(--role-primary-strong)',
          'primary-light': 'var(--role-primary-light)',
          secondary: 'var(--role-secondary)',
          soft: 'var(--role-soft)',
          'soft-border': 'var(--role-soft-border)',
          accent: 'var(--role-accent)',
          surface: 'var(--role-surface)',
          background: 'var(--role-background)',
          sidebar: 'var(--role-sidebar)',
          'sidebar-border': 'var(--role-sidebar-border)',
          'sidebar-active': 'var(--role-sidebar-active)',
          'sidebar-hover': 'var(--role-sidebar-hover)',
          'sidebar-text': 'var(--role-sidebar-text)',
          'sidebar-text-muted': 'var(--role-sidebar-text-muted)',
          text: 'var(--role-text)',
          'text-muted': 'var(--role-text-muted)',
          border: 'var(--role-border)',
        },
        // Aurora Palette (Student)
        aurora: {
          cobalt: '#1D4ED8',
          indigo: '#4338CA',
          sky: '#0284C7',
          lavender: '#818CF8',
          periwinkle: '#EEF2FF',
          ice: '#F4F7FC',
        },
        // Emerald Studio Palette (Faculty)
        emeraldStudio: {
          emerald: '#059669',
          darkEmerald: '#047857',
          teal: '#0D9488',
          mint: '#10B981',
          charcoal: '#0C1E19',
          softMint: '#ECFDF5',
        },
        // Executive Plum Palette (HOD)
        executivePlum: {
          plum: '#581C87',
          violet: '#6B21A8',
          purple: '#7E22CE',
          midnight: '#130B24',
          lavender: '#DDD6FE',
          softLilac: '#FAF5FF',
        },
        // Backward-compatible tokens
        navy: {
          DEFAULT: '#10233F',
          dark: '#0B182B',
          light: '#1A3358',
          hover: '#0E1F37',
        },
        blue: {
          DEFAULT: '#183B5B',
          dark: '#122D47',
          light: '#23527D',
        },
        teal: {
          DEFAULT: '#159A91',
          hover: '#117E77',
          light: '#E6F6F5',
          dark: '#0E6B65',
        },
        mutedBlue: {
          DEFAULT: '#EAF0F5',
          dark: '#D5DFE8',
          light: '#F2F6FA',
        },
        background: 'var(--role-background)',
        surface: 'var(--role-surface)',
        textPrimary: 'var(--role-text)',
        textSecondary: 'var(--role-text-muted)',
        brandSuccess: {
          DEFAULT: '#159B68',
          light: '#ECFDF5',
          border: '#A7F3D0',
        },
        brandWarning: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
          border: '#FDE68A',
        },
        brandDanger: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
          border: '#FECACA',
        },
        brandInfo: {
          DEFAULT: '#1D4ED8',
          light: '#EFF6FF',
          border: '#BFDBFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        card: '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        cardHover: '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
        modal: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        glow: '0 0 20px -5px var(--role-ring)',
      },
    },
  },
  plugins: [],
}
