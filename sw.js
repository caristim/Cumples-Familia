// Service Worker - Cumples Familia
// Este archivo delega en el SDK de OneSignal para el manejo de push.
// NO definas listeners de 'push' aquí: OneSignalSDK.sw.js ya los maneja.
// Agregar los propios los duplica e interfiere con la entrega de notificaciones.

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});

// Fallback: si por algún motivo OneSignal no captura el click en la
// notificación (navegadores con soporte parcial), este listener abre
// o enfoca la app manualmente.
self.addEventListener('notificationclick', event => {
    event.notification.close();

    const urlDestino = event.notification.data && event.notification.data.url
        ? event.notification.data.url
        : self.registration.scope;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            // Si la app ya está abierta, enfocarla
            for (const client of clientList) {
                if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no está abierta, abrir una ventana nueva
            if (clients.openWindow) {
                return clients.openWindow(urlDestino);
            }
        })
    );
});
