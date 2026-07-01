/* Service worker — offline app shell for the AP SE inspection app */
const CACHE = 'ap-defect-v2';
const ASSETS = [
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'fonts/AP-Light300.ttf',
  'fonts/AP-Regular400.ttf',
  'fonts/AP-Italic400.ttf',
  'fonts/AP-Medium500.ttf',
  'fonts/AP-MediumItalic500.ttf',
  'fonts/AP-Bold700.ttf',
  'fonts/AP-BoldItalic700.ttf',
  'fonts/AP-Condensed300.ttf'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // Navigations → serve cached app shell first (offline-first SPA)
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('index.html').then((hit) => hit || fetch(req)));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
