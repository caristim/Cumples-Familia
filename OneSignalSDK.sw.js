// Service Worker - Cumples Familia
// IMPORTANTE: Este archivo DEBE llamarse "OneSignalSDK.sw.js" para que
// OneSignal v16 lo registre correctamente en Android y en iOS (PWA).
//
// NO definas listeners propios de 'push' aquí: OneSignalSDK.sw.js ya los
// maneja. Agregarlos duplica la lógica e impide la entrega de notificaciones.

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

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
            for (const client of clientList) {
                if (client.url.startsWith(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlDestino);
            }
        })
    );
});
