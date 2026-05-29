// Service Worker - Cumples Familia
// Este archivo SOLO delega en el SDK de OneSignal.
// NO definas listeners de 'push' ni 'notificationclick' aqui:
// OneSignalSDK.sw.js ya los maneja. Agregar los propios los duplica
// e interfiere con la entrega de notificaciones.

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});
