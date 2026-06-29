// Cumples Familia — Service Worker v2.1
// WebPush nativo (sin OneSignal, sin Firebase SDK)

const SW_VERSION    = 'cf-sw-v2.1';
const APP_ROOT      = 'https://caristim.github.io/Cumples-Familia/';
const CACHE_NAME    = 'cf-cache-v2.1';
const ICON_URL      = 'https://caristim.github.io/Cumples-Familia/icon-192.png';

const PRECACHE_URLS = [
  APP_ROOT,
  APP_ROOT + 'index.html',
  APP_ROOT + 'manifest.json',
  APP_ROOT + 'icon-192.png',
  APP_ROOT + 'icon-512.png',
];

// ── Push: mostrar notificación ───────────────────────────────────────────────
self.addEventListener('push', e => {
  console.log('[CF-SW] Push recibido');
  e.waitUntil(handlePush(e));
});

async function handlePush(e) {
  let titulo = 'Cumples Familia';
  let cuerpo = 'Hay un cumpleaños hoy 🎉';
  let url    = APP_ROOT;
  let tag    = 'cf-cumple-' + new Date().toISOString().slice(0, 10);

  if (e.data) {
    try {
      const d = e.data.json();
      titulo  = d.title || titulo;
      cuerpo  = d.body  || cuerpo;
      url     = d.url   || url;
      tag     = d.tag   || tag;
    } catch (_) {
      cuerpo = e.data.text() || cuerpo;
    }
  }

  await self.registration.showNotification(titulo, {
    body:               cuerpo,
    icon:               ICON_URL,
    badge:              ICON_URL,
    tag:                tag,
    requireInteraction: true,
    vibrate:            [200, 100, 200, 100, 200],
    data:               { url },
  });
}

// ── Notificationclick: abrir la app ─────────────────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const targetUrl = (e.notification.data && e.notification.data.url) || APP_ROOT;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.startsWith(APP_ROOT));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ── Lifecycle ────────────────────────────────────────────────────────────────
self.addEventListener('install', e => {
  console.log('[CF-SW] Instalando:', SW_VERSION);
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(err => console.warn('[CF-SW] Cache parcial:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  console.log('[CF-SW] Activando:', SW_VERSION);
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first para recursos propios ─────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(APP_ROOT)) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Clonar solo si la respuesta es válida y clonable
        if (res && res.status === 200) {
          try {
            const cloned = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, cloned));
          } catch (cloneError) {
            // Si el clone falla, ignoramos el cacheo (la respuesta ya se usó)
            console.warn('[CF-SW] No se pudo clonar la respuesta para cachear:', cloneError);
          }
        }
        return res;
      }).catch(() =>
        caches.match(APP_ROOT + 'index.html')
          .then(fb => fb || new Response('Sin conexión', { status: 503 }))
      );
    })
  );
});
