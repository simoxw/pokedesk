import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrazione del Service Worker solo in produzione, per non interferire con il dev server
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;

    try {
      const expectedSwUrl = new URL(swUrl, window.location.href).href;
      const registrations = await navigator.serviceWorker.getRegistrations();

      const getRegistrationScriptUrl = (registration: ServiceWorkerRegistration): string | undefined =>
        registration.active?.scriptURL ?? registration.installing?.scriptURL ?? registration.waiting?.scriptURL;

      for (const registration of registrations) {
        const registrationScriptUrl = getRegistrationScriptUrl(registration);
        if (registrationScriptUrl && registrationScriptUrl !== expectedSwUrl) {
          await registration.unregister();
          if (import.meta.env.DEV) {
            console.info('SW obsoleto disinstallato:', registrationScriptUrl);
          }
        }
      }

      const registration = await navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' });
      if (import.meta.env.DEV) {
        console.log('SW registrato con successo:', registration.scope);
      }

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (import.meta.env.DEV) {
              console.log('Nuovo contenuto disponibile: invio evento all’app');
            }
            window.dispatchEvent(new CustomEvent('swUpdate'));
          }
        };
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Errore registrazione SW:', error);
      }
      // In produzione, falliamo silenziosamente, in modo che il gioco continui a funzionare.
    }
  });
}


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);