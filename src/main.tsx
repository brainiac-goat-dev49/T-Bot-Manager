import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import './index.css';

// Suppress ResizeObserver loop errors commonly caused by Recharts and other UI libraries
const originalError = console.error;
console.error = (...args: any[]) => {
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('ResizeObserver loop')) {
    return;
  }
  originalError.call(console, ...args);
};

window.addEventListener('error', (e) => {
  if (
    e.message && (
      e.message.includes('ResizeObserver loop completed with undelivered notifications') || 
      e.message.includes('ResizeObserver loop limit exceeded')
    )
  ) {
    e.stopImmediatePropagation();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
