var CACHE = 'cc-v2';
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

var alertTimer = null;
var doneTimer = null;

self.addEventListener('message', function(e) {
  if (!e.data) return;

  if (e.data.type === 'SCHEDULE_ALERT') {
    if (alertTimer) { clearTimeout(alertTimer); alertTimer = null; }
    if (doneTimer)  { clearTimeout(doneTimer);  doneTimer  = null; }

    var d = e.data;

    if (d.alertDelay !== null && d.alertDelay >= 0) {
      alertTimer = setTimeout(function() {
        self.registration.showNotification(d.alertTitle, {
          body: d.alertBody,
          icon: d.icon,
          tag: 'cc-alert',
          renotify: true,
          vibrate: [300, 100, 300]
        });
      }, d.alertDelay);
    }

    doneTimer = setTimeout(function() {
      self.registration.showNotification(d.doneTitle, {
        body: d.doneBody,
        icon: d.icon,
        tag: 'cc-done',
        renotify: true,
        vibrate: [500, 200, 500, 200, 500]
      });
    }, d.doneDelay);
    return;
  }

  if (e.data.type === 'CANCEL_ALERT') {
    if (alertTimer) { clearTimeout(alertTimer); alertTimer = null; }
    if (doneTimer)  { clearTimeout(doneTimer);  doneTimer  = null; }
    return;
  }

  if (e.data.type === 'NOTIFY') {
    var opts = e.data.opts;
    e.waitUntil(
      self.registration.showNotification(opts.title, {
        body: opts.body,
        icon: opts.icon,
        badge: opts.icon,
        tag: 'cc-alert',
        renotify: true,
        vibrate: [300, 100, 300]
      })
    );
  }
});

