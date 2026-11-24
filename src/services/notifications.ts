import { api } from './api';

export async function requestNotificationPermission(userId?: string): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      await registerServiceWorkerPush(userId);
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await registerServiceWorkerPush(userId);
        showLocalNotification('MASTER PLAY Notifikasyon Aktif ! 🔔', {
          body: 'W ap resevwa alèt sou konpetisyon, match, ak rekonpans MASTER PLAY kounye a.',
          icon: '/favicon.ico',
        });
        return true;
      }
    }
  } catch (err) {
    console.error('Error requesting notification permission:', err);
  }
  return false;
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          badge: '/favicon.ico',
          icon: '/favicon.ico',
          vibrate: [200, 100, 200],
          ...options,
        } as any);
      });
    } else {
      new Notification(title, options);
    }
  } catch (e) {
    console.warn('Could not display native notification:', e);
  }
}

async function registerServiceWorkerPush(userId?: string) {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      // Register push token with backend if available
      const subscription = await registration.pushManager.getSubscription();
      if (subscription && userId) {
        await api.subscribePush(userId, subscription.toJSON());
      }
    }
  } catch (e) {
    console.warn('Push manager registration error:', e);
  }
}
