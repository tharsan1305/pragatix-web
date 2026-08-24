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
        <Toaster position="top-right" reverseOrder={false} />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
