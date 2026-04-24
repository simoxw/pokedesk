export const NotificationService = {
  async requestPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  },

  sendNotification(message: string) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    // Android PWA: new Notification() è illegale, usa ServiceWorkerRegistration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then(registration => {
          registration.showNotification('Pokedesk', {
            body: message,
            icon: '/icon-192.png',
          });
        })
        .catch(() => {
          // Fallback silenzioso — non crashare l'app per una notifica
        });
      return;
    }

    // Fallback desktop (Chrome, Firefox, etc.)
    try {
      new Notification('Pokedesk', {
        body: message,
        icon: '/icon-192.png',
      });
    } catch {
      // Fail silenzioso
    }
  }
};