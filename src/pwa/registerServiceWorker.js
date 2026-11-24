import { Capacitor } from '@capacitor/core';

export function registerServiceWorker() {
  if (!import.meta.env.PROD || Capacitor.isNativePlatform()) return;
  if (!('serviceWorker' in navigator)) return;

  const baseUrl = import.meta.env.BASE_URL;
  navigator.serviceWorker.register(`${baseUrl}sw.js`, { scope: baseUrl })
    .catch(error => {
      console.warn('[PWA] Não foi possível registrar o service worker.', error);
    });
}
