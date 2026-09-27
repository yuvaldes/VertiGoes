import { Platform } from 'react-native';

/** Installation is supported on HTTPS hosts; Metro development stays worker-free. */
export function registerServiceWorker() {
  if (Platform.OS !== 'web' || __DEV__ || typeof window === 'undefined' ||
      !window.isSecureContext || !('serviceWorker' in navigator)) return;

  const register = () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => console.warn('Offline fallback is unavailable. The online app is still usable.'));
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
