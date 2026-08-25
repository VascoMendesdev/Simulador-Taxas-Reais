// Service worker do simulador "Calcule sua taxa real" — uso pessoal.
// Estratégia: network-first para o HTML (garante que a lógica de cálculo
// mais recente seja sempre usada quando há conexão), com fallback para o
// cache quando o cliente está offline. Ícones/manifesto usam cache-first
// (não mudam com frequência).

const CACHE_NAME = 'taxa-real-pessoal-v1';
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icon-180.png',
  './icon-512.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var req = event.request;

  // Só interceptamos requisições GET do próprio app (HTML/manifest/ícones).
  // Chamadas ao contador de uso (Apps Script) passam direto, sem cache.
  if (req.method !== 'GET') { return; }

  var isAppShell = APP_SHELL.some(function (path) {
    return req.url.indexOf(path.replace('./', '')) !== -1;
  });
  if (!isAppShell) { return; }

  event.respondWith(
    fetch(req)
      .then(function (networkResponse) {
        var copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copy); });
        return networkResponse;
      })
      .catch(function () {
        return caches.match(req);
      })
  );
});
