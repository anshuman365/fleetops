const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    if (publicUrl.origin !== window.location.origin) return;
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() =>
          console.log('[FleetOps PWA] Served cache-first by a service worker.')
        );
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker.register(swUrl).then(registration => {
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            console.log('[FleetOps PWA] New content available; will refresh on next tab open.');
            if (config?.onUpdate) config.onUpdate(registration);
          } else {
            console.log('[FleetOps PWA] Content cached for offline use.');
            if (config?.onSuccess) config.onSuccess(registration);
          }
        }
      };
    };
  }).catch(err => console.error('SW registration error:', err));
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then(response => {
      const ct = response.headers.get('content-type');
      if (response.status === 404 || (ct && ct.indexOf('javascript') === -1)) {
        navigator.serviceWorker.ready.then(r => r.unregister());
        window.location.reload();
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => console.log('[FleetOps PWA] No internet. Running offline.'));
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(r => r.unregister()).catch(e => console.error(e));
  }
}
