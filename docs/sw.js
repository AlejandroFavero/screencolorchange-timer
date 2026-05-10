var CACHE = 'cc-v1';
var FILES = ['./index.html', './manifest.json', './sw.js', './icon.svg'];

self.addEventListener('install', function(e) {
  e.waitUntil(caches.open(CACHE).then(function(c) { return c.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  e.respondWith(caches.match(e.request).then(function(r) { return r || fetch(e.request); }));
});

self.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== 'NOTIFY') return;
  var opts = e.data.opts;
  e.waitUntil(
    self.registration.showNotification(opts.title, {
      body: opts.body,
      icon: opts.icon,
      badge: opts.icon,
      tag: 'cc-alert',
      renotify: true,
      requireInteraction: false
    })
  );
});
