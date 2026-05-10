var CACHE = 'cc-v3';
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

var alertTimer   = null;
var doneTimer    = null;
var pendingResolve = null; // resolves the waitUntil promise on cancel or done

self.addEventListener('message', function(e) {
  if (!e.data) return;

  if (e.data.type === 'SCHEDULE_ALERT') {
    // Clear any running timers and release the previous waitUntil
    if (alertTimer)    { clearTimeout(alertTimer);  alertTimer    = null; }
    if (doneTimer)     { clearTimeout(doneTimer);   doneTimer     = null; }
    if (pendingResolve){ pendingResolve();           pendingResolve = null; }

    var d = e.data;

    // e.waitUntil keeps the service worker alive until the promise resolves.
    // Without this Chrome suspends the SW when the screen locks and the
    // setTimeout callbacks never fire on time.
    e.waitUntil(new Promise(function(resolve) {
      pendingResolve = resolve;

      if (d.alertDelay !== null && d.alertDelay >= 0) {
        alertTimer = setTimeout(function() {
          alertTimer = null;
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
        doneTimer      = null;
        pendingResolve = null;
        var p = self.registration.showNotification(d.doneTitle, {
          body: d.doneBody,
          icon: d.icon,
          tag: 'cc-done',
          renotify: true,
          vibrate: [500, 200, 500, 200, 500]
        });
        (p || Promise.resolve()).then(resolve, resolve);
      }, d.doneDelay);
    }));
    return;
  }

  if (e.data.type === 'CANCEL_ALERT') {
    if (alertTimer)    { clearTimeout(alertTimer);  alertTimer    = null; }
    if (doneTimer)     { clearTimeout(doneTimer);   doneTimer     = null; }
    if (pendingResolve){ pendingResolve();           pendingResolve = null; }
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
