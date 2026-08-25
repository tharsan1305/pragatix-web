import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './store/authContext'
import ErrorBoundary from './components/ErrorBoundary.tsx'

const initialLoader = document.getElementById('initial-loader');
if (initialLoader) {
  initialLoader.style.opacity = '0';
  initialLoader.style.transition = 'opacity 0.3s ease';
  setTimeout(() => initialLoader.remove(), 300);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
        <Toaster 
          position="top-right" 
          reverseOrder={false} 
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.875rem',
            },
            success: {
              iconTheme: {
                primary: 'var(--green, #166534)',
                secondary: 'var(--card, #ffffff)',
              },
            },
            error: {
              iconTheme: {
                primary: 'var(--accent, #E50914)',
                secondary: 'var(--card, #ffffff)',
              },
            },
          }}
        />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
