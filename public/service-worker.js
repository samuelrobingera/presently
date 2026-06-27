const CACHE_NAME = 'presently-v1';
const STATIC_CACHE = 'presently-static-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => {
          return new Request(url, { cache: 'reload' });
        })).catch(err => {
          console.warn('[Service Worker] Failed to cache some assets:', err);
        });
      })
  );

  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip Firebase requests - let them fail naturally when offline
  if (request.url.includes('firebaseio.com') ||
      request.url.includes('firebase.googleapis.com') ||
      request.url.includes('firebaseapp.com')) {
    return;
  }

  // Network-first strategy for API calls
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background sync for queued timer updates
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);

  if (event.tag === 'sync-timer-updates') {
    event.waitUntil(syncTimerUpdates());
  }
});

async function syncTimerUpdates() {
  try {
    // Open IndexedDB and process pending syncs
    const db = await openDB();
    const transaction = db.transaction(['timer-state'], 'readonly');
    const store = transaction.objectStore('timer-state');

    const pendingSyncs = await new Promise((resolve) => {
      const request = store.get('pending-syncs');
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.syncs : []);
      };
      request.onerror = () => resolve([]);
    });

    if (pendingSyncs.length > 0) {
      console.log('[Service Worker] Processing', pendingSyncs.length, 'pending syncs');

      // Notify client to handle sync
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_PENDING_UPDATES',
          count: pendingSyncs.length
        });
      });
    }
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('presently-offline', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
