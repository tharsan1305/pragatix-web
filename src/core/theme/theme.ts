/**
 * Core Theme & Design Tokens for React Web
 * Parity with Flutter's core/theme architecture.
 */

export const theme = {
  colors: {
    primary: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
    },
    secondary: {
      500: '#EC4899',
      600: '#DB2777',
    },
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    background: {
      light: '#F9FAFB',
      dark: '#0F172A',
      card: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
      light: '#94A3B8',
    },
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
};
