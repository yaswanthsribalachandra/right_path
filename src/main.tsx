import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { handleGoogleRedirect } from './lib/googleAuth';

// Initialize theme
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
} else {
  document.documentElement.classList.remove('light');
}

handleGoogleRedirect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
