const CACHE = 'tracker-tools-v2';
const ASSETS = ['/', '/index.html', '/style.css', '/js/app.js', '/js/state.js', '/js/callbacks.js', '/js/i18n.js', '/js/utils.js', '/js/persist.js', '/js/history.js', '/js/api.js', '/js/render.js', '/js/compare.js', '/js/indexers.js', '/js/torrents.js', '/js/export.js', '/js/constants.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('/api/') || e.request.url.includes('/config/')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      if (res.ok && e.request.method === 'GET') {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match('/index.html')))
  );
});
