/* EngineerOS · Service Worker
   Makes the app installable and fully offline-capable.

   Strategy:
   • Precache the app shell + every module + icons on install.
   • Navigations , network-first (fresh on each deploy), fall back to cached shell offline.
   • Same-origin , stale-while-revalidate (instant load + quiet background updates).
   • Cross-origin, cache-first (Lucide + Google Fonts work offline once seen).
   No manual version bumps needed for content, SWR keeps assets fresh. */

const CACHE = 'engineeros-v1';

const PRECACHE = [
  '/', '/index.html', '/manifest.webmanifest',
  '/favicon.svg', '/favicon-32.png', '/badge-96.png', '/apple-touch-icon.png', '/icon-192.png', '/icon-512.png', '/og.png',
  '/styles/tokens.css', '/styles/base.css', '/styles/components.css', '/styles/studio.css', '/styles/animations.css', '/styles/print.css',
  '/src/main.js',
  '/src/core/state.js', '/src/core/dom.js', '/src/core/feedback.js', '/src/core/theme.js', '/src/core/router.js',
  '/src/core/context.js', '/src/core/coach.js', '/src/core/push.js', '/src/core/push-context.js', '/src/core/sync.js', '/src/core/helpers.js',
  '/src/data/journeys.js', '/src/data/resources.js', '/src/data/resume-assets.js', '/src/data/earn.js', '/src/data/interview.js',
  '/src/ui/components.js',
  '/src/views/onboarding.js', '/src/views/home.js', '/src/views/journeys.js', '/src/views/mission.js',
  '/src/views/build.js', '/src/views/resume.js', '/src/views/portfolio.js', '/src/views/linkedin.js',
  '/src/views/progress.js', '/src/views/review.js', '/src/views/resources.js', '/src/views/earn.js', '/src/views/launchpad.js', '/src/views/settings.js',
];

self.addEventListener('install', (e) => {
  // Precache the shell, but do NOT skipWaiting: on an update the new worker stays
  // in "waiting" so the app can show a calm "Update ready" prompt. It activates
  // when the page sends SKIP_WAITING (the Refresh button), or when all tabs close.
  e.waitUntil(
    caches.open(CACHE)
      // addAll is all-or-nothing; add individually so one 404 can't fail the whole install.
      .then((cache) => Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => null))))
  );
});

/* The page asks us to activate a waiting update (from the "Refresh" prompt). */
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
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
  const url = new URL(req.url);

  // Navigations: network-first so deploys show up; offline, cached shell.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((r) => { const c = r.clone(); caches.open(CACHE).then((cache) => cache.put('/index.html', c)); return r; })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Same-origin assets: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((r) => { if (r && r.status === 200) cache.put(req, r.clone()); return r; })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Cross-origin (CDN fonts / icons): cache-first.
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) return cached;
      try {
        const r = await fetch(req);
        if (r && (r.status === 200 || r.type === 'opaque')) cache.put(req, r.clone());
        return r;
      } catch (_) { return cached || Response.error(); }
    })
  );
});

/* Incoming push. The server payload is only a trigger; the content is composed
   here from the on-device summary the app stashed in IndexedDB, so the reminder
   can name today's real mission without the server ever knowing it. */
self.addEventListener('push', (e) => {
  e.waitUntil((async () => {
    let data = {};
    try { data = e.data ? e.data.json() : {}; } catch (_) { data = {}; }
    const ctx = await readPushContext();
    const n = composeNotification(ctx, data);
    await self.registration.showNotification(n.title, n.options);
  })());
});

/* Read the "today" summary the app wrote (db engineeros, store kv). */
function readPushContext() {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open('engineeros', 1);
      req.onupgradeneeded = () => { try { req.result.createObjectStore('kv'); } catch (_) {} };
      req.onsuccess = () => {
        try {
          const tx = req.result.transaction('kv', 'readonly');
          const g = tx.objectStore('kv').get('push-context');
          g.onsuccess = () => resolve(g.result || null);
          g.onerror = () => resolve(null);
        } catch (_) { resolve(null); }
      };
      req.onerror = () => resolve(null);
    } catch (_) { resolve(null); }
  });
}

/* Compose a calm, specific notification. Prefers on-device context, then the
   server trigger's copy, then a gentle default. */
function composeNotification(ctx, data) {
  const base = {
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    tag: 'engineeros-daily',
    renotify: true,
    timestamp: Date.now(),
    vibrate: [60, 40, 60],
    lang: 'en',
    dir: 'ltr',
    data: { url: '/' },
    actions: [{ action: 'open', title: 'Open today’s mission' }],
  };
  if (ctx && ctx.allDone) {
    return { title: 'Every mission done', options: Object.assign({}, base, {
      body: 'You built a real body of work. Polish your portfolio or start earning today.',
      data: { url: '/#/build' },
      actions: [{ action: 'open', title: 'Open Build Studio' }],
    }) };
  }
  if (ctx && ctx.missionTitle) {
    const streakLine = ctx.streak > 0
      ? 'Day ' + ctx.streak + ' streak. One small win keeps it alive.'
      : 'One small win gets your streak started.';
    return { title: 'Today: ' + ctx.missionTitle, options: Object.assign({}, base, {
      body: streakLine,
      data: { url: ctx.missionId ? '/#/mission/' + ctx.missionId : '/' },
    }) };
  }
  return { title: (data && data.title) || 'EngineerOS', options: Object.assign({}, base, {
    body: (data && data.body) || 'One small win today keeps your streak alive.',
    actions: [{ action: 'open', title: 'Open EngineerOS' }],
  }) };
}

/* If the browser rotates the subscription, re-subscribe and re-register it. */
self.addEventListener('pushsubscriptionchange', (e) => {
  e.waitUntil((async () => {
    try {
      const res = await fetch('/api/push-key');
      const { key } = await res.json();
      if (!key) return;
      const sub = await self.registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(key),
      });
      await fetch('/api/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
    } catch (_) {}
  })());
});

function urlB64ToUint8Array(base64) {
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

/* Tapping a notification focuses the open app (or opens it), at the right view. */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) { if (c.navigate) { try { c.navigate(url); } catch (_) {} } return c.focus(); } }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
