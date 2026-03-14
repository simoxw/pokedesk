import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrazione del Service Worker solo in produzione, per non interferire con il dev server
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Il base URL è configurato in vite.config.ts (es. '/pokedesk/')
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;

    navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' })
      .then((registration) => {
        console.log('SW registrato con successo:', registration.scope);

        // Se c'è un aggiornamento pronto, notifica l'app (non ricaricare automaticamente)
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('Nuovo contenuto disponibile: invio evento all’app');
                window.dispatchEvent(new CustomEvent('swUpdate'));
              }
            };
          }
        };
      })
      .catch((error) => {
        console.error('Errore registrazione SW:', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);