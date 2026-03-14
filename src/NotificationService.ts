export const NotificationService = {
  async requestPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  },

  sendNotification(message: string) {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      new Notification('Pokedesk', {
        body: message,
        icon: '/icon-192.png'
      });
    }
  }
};
