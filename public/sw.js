const CACHE = 'study-hub-shell-v1-1';
const BASE = '/study-hub/';
const PRECACHE = [BASE, `${BASE}manifest.webmanifest`, `${BASE}icons/icon-192.png`, `${BASE}icons/icon-512.png`, `${BASE}icons/apple-touch-icon.png`];

self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE))); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
self.addEventListener('message', event => { if (event.data?.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE).then(cache=>cache.put(BASE,copy)); return response; }).catch(()=>caches.match(BASE)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if(response.ok) caches.open(CACHE).then(cache=>cache.put(event.request,response.clone())); return response; })));
});
