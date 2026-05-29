importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// ── INSTALACIÓN ────────────────────────────────────────────────────
self.addEventListener('install', event => {
    console.log('🔧 Service Worker: Instalando...');
    self.skipWaiting();
});

// ── ACTIVACIÓN ──────────────────────────────────────────────────────
self.addEventListener('activate', event => {
    console.log('✅ Service Worker: Activado');
    event.waitUntil(self.clients.claim());
});

// ── MANEJO DE NOTIFICACIONES PUSH ────────────────────────────────────
self.addEventListener('push', event => {
    console.log('📬 Service Worker: Notificación push recibida');
    
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('Datos de notificación:', data);
            
            const options = {
                body: data.contents?.en || data.body || 'Nueva notificación',
                icon: data.large_icon || 'https://cdn-icons-png.flaticon.com/512/3159/3159066.png',
                badge: 'https://cdn-icons-png.flaticon.com/512/3159/3159066.png',
                tag: 'cumpleanos-notificacion',
                requireInteraction: true,
                vibrate: [200, 100, 200],
                sound: 'default',
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: 1
                }
            };
            
            event.waitUntil(
                self.registration.showNotification(data.headings?.en || '¡Cumpleaños!', options)
            );
        } catch (e) {
            console.error('Error al procesar notificación push:', e);
            event.waitUntil(
                self.registration.showNotification('¡Cumpleaños!', {
                    body: 'Alguien está de cumpleaños hoy',
                    icon: 'https://cdn-icons-png.flaticon.com/512/3159/3159066.png'
                })
            );
        }
    }
});

// ── MANEJO DE CLICS EN NOTIFICACIONES ────────────────────────────────
self.addEventListener('notificationclick', event => {
    console.log('👆 Service Worker: Notificación clickeada');
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // Si ya hay una ventana abierta, enfocarla
                for (let i = 0; i < clientList.length; i++) {
                    const client = clientList[i];
                    if (client.url === '/' && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Si no hay ventana abierta, abrir una nueva
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// ── CACHÉ PARA OFFLINE (OPCIONAL) ────────────────────────────────────
const CACHE_NAME = 'cumples-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// Cachear recursos al instalar
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Service Worker: Cacheando recursos');
                return cache.addAll(urlsToCache);
            })
            .catch(err => {
                console.warn('⚠️ No se pudieron cachear todos los recursos:', err);
            })
    );
});

// ── ESTRATEGIA DE CACHÉ: NETWORK FIRST, FALLBACK A CACHÉ ────────────
self.addEventListener('fetch', event => {
    // Solo cachear GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // No cachear respuestas que no sean exitosas
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clonar la respuesta
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // Si falla la red, intentar obtener del caché
                return caches.match(event.request)
                    .then(response => {
                        return response || new Response('Offline - No hay conexión', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// ── LIMPIEZA DE CACHÉS ANTIGUOS ──────────────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Service Worker: Eliminando caché antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

console.log('✅ Service Worker cargado correctamente');
