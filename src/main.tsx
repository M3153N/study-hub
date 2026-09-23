import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/study-hub/sw.js', { scope: '/study-hub/' }).then(registration => {
    const announce = () => window.dispatchEvent(new CustomEvent('study-hub-update', { detail: registration }));
    if (registration.waiting) announce();
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => {
      if (registration.waiting && navigator.serviceWorker.controller) announce();
    }));
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload());
}
