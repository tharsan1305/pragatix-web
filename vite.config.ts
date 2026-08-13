/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Security headers applied to the dev server.
// IMPORTANT: These same headers MUST be set in Nginx / Spring Boot for production.
// X-Frame-Options, HSTS, and a proper CSP set here are HTTP-header based (not meta tags),
// which is the only form browsers enforce for cross-origin responses.
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // HSTS only meaningful over HTTPS; included here for completeness so the header
  // is present when testing behind a reverse proxy in staging.
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    headers: securityHeaders,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    // Disable source maps in production to prevent source code leakage.
    // A01/A05: Source maps expose original app logic to anyone with devtools.
    // Set to 'hidden' (only for error monitoring like Sentry) or false (full disable).
    sourcemap: false,
  },
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/**',
      ],
    },
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './junit.xml',
    },
  },
})
