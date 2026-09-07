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
          DEFAULT: '#15527A',
          dark: '#0e3d5c',
          light: '#1a6596',
          tint: '#e8f0f7',
          bg: '#e8f0f7',
        },
        primary: {
          DEFAULT: '#15527A',
          dark: '#0e3d5c',
          light: '#1a6596',
          tint: '#e8f0f7',
        },
        red: {
          brand: '#ED3838',
          brandDark: '#cc2d2d',
          brandLight: '#ff5555',
          dark: '#cc2d2d',
          light: '#ff5555',
          tint: '#fef0f0',
          bg: '#fef0f0',
        },
        secondary: {
          DEFAULT: '#ED3838',
          dark: '#cc2d2d',
          light: '#ff5555',
          tint: '#fef0f0',
        },
        surface: {
          bg: '#F7F9FB',
          white: '#FFFFFF',
        },
        app: {
          'text-dark': '#222222',
          'text-muted': '#6b7280',
          'text-light': '#9ca3af',
          'border': '#e5e7eb',
          'border-dark': '#d1d5db',
          'success': '#16a34a',
          'success-bg': '#dcfce7',
          'success-dark': '#15803d',
          'warning': '#d97706',
          'warning-bg': '#fef3c7',
          'warning-dark': '#b45309',
          'danger': '#dc2626',
          'danger-bg': '#fee2e2',
          'danger-dark': '#b91c1c',
          'info': '#2563eb',
          'info-bg': '#dbeafe',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        DEFAULT: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)',
        lg: '0 10px 15px rgba(0,0,0,0.08), 0 4px 6px rgba(0,0,0,0.05)',
        xl: '0 20px 60px rgba(0,0,0,0.25)',
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}

