const CACHE_NAME = 'dragon-io-mobile-v4';
const CORE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './strings.js?v=20260706-3',
  './game.js?v=20260706-3',
  './manifest.webmanifest',
  './assets/backgrounds/sky-canyon.png',
  './assets/screens/title-screen.png',
  './assets/screens/lobby-screen.png',
  './assets/sprites/dragon-red.png',
  './assets/sprites/dragon-ignis.png',
  './assets/sprites/dragon-lumina.png',
  './assets/sprites/dragon-voltis.png',
  './assets/sprites/dragon-venora.png',
  './assets/sprites/dragon-shadow.png',
  './assets/sprites/wyvern-blue.png',
  './assets/sprites/elite-parts-wyvern.png',
  './assets/sprites/wyvern-crimson-armored.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  })));
});
