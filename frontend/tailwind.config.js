/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
        background: '#F7F9FC',
        surface: '#FFFFFF',
        textPrimary: '#172B43',
        textSecondary: '#65758B',
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
          DEFAULT: '#183B5B',
          light: '#EFF6FF',
          border: '#BFDBFE',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(16, 35, 63, 0.04)',
        card: '0 1px 3px 0 rgba(16, 35, 63, 0.05), 0 1px 2px -1px rgba(16, 35, 63, 0.05)',
        cardHover: '0 4px 6px -1px rgba(16, 35, 63, 0.08), 0 2px 4px -2px rgba(16, 35, 63, 0.04)',
        modal: '0 20px 25px -5px rgba(16, 35, 63, 0.1), 0 8px 10px -6px rgba(16, 35, 63, 0.1)',
      },
    },
  },
  plugins: [],
}
