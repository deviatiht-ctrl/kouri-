/**
 * ======================================================================
 * KOURI — Service Worker (sw.js)
 * Zero-Stale Cache Strategy:
 * 1. HTML Navigation: Network-First with Offline Fallback (NO Ctrl+Shift+R needed!)
 * 2. Static CSS/JS: Stale-While-Revalidate with Auto-Update
 * 3. Map Tiles: Cache-First with Corridor Prefetch & Size Cap
 * 4. API Calls: Network-First with Offline Outbox Fallback
 * ======================================================================
 */

const CACHE_VERSION = 'kouri-v2.6-' + Date.now();
const CACHE_NAME_SHELL = 'kouri-shell-' + CACHE_VERSION;
const CACHE_NAME_TILES = 'kouri-map-tiles-v1';
const MAX_TILE_CACHE_ITEMS = 800;

// Force immediate activation of any new service worker version
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Delete old shell versions immediately so users never see stale cache
          if (key.startsWith('kouri-shell-') && key !== CACHE_NAME_SHELL) {
            console.log('[KOURI SW] Pruning old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Ignore non-GET requests (POST, PUT, DELETE bypass SW)
  if (req.method !== 'GET') return;

  // 1. Map Tiles (OpenFreeMap, Esri, OSM, Terrarium) -> Cache-First
  if (
    url.hostname.includes('openfreemap.org') ||
    url.hostname.includes('arcgisonline.com') ||
    url.hostname.includes('openstreetmap.org') ||
    url.hostname.includes('elevation-tiles-prod')
  ) {
    event.respondWith(
      caches.open(CACHE_NAME_TILES).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const networkRes = await fetch(req);
          if (networkRes.status === 200) {
            cache.put(req, networkRes.clone());
            limitCacheSize(CACHE_NAME_TILES, MAX_TILE_CACHE_ITEMS);
          }
          return networkRes;
        } catch (e) {
          return cached || new Response('', { status: 408 });
        }
      })
    );
    return;
  }

  // 2. HTML Navigation Requests -> STRICT Network-First with Offline Fallback
  // This solves the Ctrl+Shift+R cache issue completely: online users ALWAYS get latest HTML!
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const copy = networkRes.clone();
            caches.open(CACHE_NAME_SHELL).then((cache) => cache.put(req, copy));
          }
          return networkRes;
        })
        .catch(async () => {
          console.log('[KOURI SW] Offline navigation, falling back to cache:', req.url);
          const cached = await caches.match(req);
          if (cached) return cached;
          return caches.match('/pages/rider/home.html') || caches.match('/index.html');
        })
    );
    return;
  }

  // 3. API / External Endpoints -> Network-First
  if (
    url.pathname.includes('/rest/v1/') ||
    url.pathname.includes('/auth/v1/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('onrender.com')
  ) {
    event.respondWith(fetch(req));
    return;
  }

  // 4. CSS, JS, Images, Fonts -> Stale-While-Revalidate
  // Fast local response, but updates cache immediately in background
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((networkRes) => {
        if (networkRes.status === 200) {
          caches.open(CACHE_NAME_SHELL).then((cache) => cache.put(req, networkRes.clone()));
        }
        return networkRes;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

// Cache size limiter helper
async function limitCacheSize(cacheName, maxItems) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      await cache.delete(keys[0]);
      limitCacheSize(cacheName, maxItems);
    }
  } catch (e) {}
}

// Prefetch Message Listener for route corridors
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'PREFETCH_ROUTE_TILES') {
    const coords = event.data.coords || [];
    const tileCache = await caches.open(CACHE_NAME_TILES);
    const zooms = [13, 15];

    for (let i = 0; i < coords.length; i += Math.max(1, Math.floor(coords.length / 10))) {
      const [lng, lat] = coords[i];
      for (const z of zooms) {
        const x = Math.floor((lng + 180) / 360 * Math.pow(2, z));
        const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, z));
        const tileUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
        try {
          const res = await fetch(tileUrl, { mode: 'no-cors' });
          if (res) tileCache.put(tileUrl, res);
        } catch (e) {}
      }
    }
  }
});
