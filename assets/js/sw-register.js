/**
 * ======================================================================
 * KOURI — Service Worker Lifecycle & Instant Cache Invalidation
 * Automatically ensures fresh code is loaded without requiring Ctrl+Shift+R.
 * ======================================================================
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        // Force check for fresh version immediately
        registration.update();

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                console.log('[KOURI SW] New version activated cleanly.');
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[KOURI SW] Registration error:', err);
      });

    // When the controlling service worker changes, notify or refresh if needed
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[KOURI SW] Controller changed to latest version.');
    });
  });
}
