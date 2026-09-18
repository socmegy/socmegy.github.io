(() => {
  'use strict';

  // Installation is intentionally not surfaced inside the site. Users can
  // install Watermark Pro from Chrome's own menu when the browser offers it.
  // Keep only the app-scoped service-worker registration needed for the web
  // app to work normally.
  if (!('serviceWorker' in navigator) || !['http:', 'https:'].includes(location.protocol)) return;
  if (!location.pathname.startsWith('/watermark-pro/')) return;

  const reloadKey = 'wp-sw-reload-v168';
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || sessionStorage.getItem(reloadKey)) return;
    sessionStorage.setItem(reloadKey, '1');
    location.reload();
  });

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/watermark-pro/sw.js?v=168', {
        scope: '/watermark-pro/',
        updateViaCache: 'none'
      });
      await registration.update();
    } catch (error) {
      console.warn('Watermark Pro service worker:', error);
    }
  });
})();
