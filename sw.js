/* 習慣記録 Service Worker

   index.html を変更したら、この CACHE 名を必ず上げること（habit-v1 → habit-v2）。
   上げないと、端末に残った古い版が表示され続ける。 */

const CACHE = 'habit-v4';

const ASSETS = [
  './index.html',
  './sw.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(name){ return name !== CACHE; })
             .map(function(name){ return caches.delete(name); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

/* キャッシュ優先。
   同一オリジンの取得だけキャッシュに足す。
   取得に失敗したら index.html を返す（機内モードでも起動できるように）。 */
self.addEventListener('fetch', function(event){
  const request = event.request;
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(function(hit){
      if (hit) return hit;

      return fetch(request).then(function(response){
        const sameOrigin = new URL(request.url).origin === self.location.origin;
        if (sameOrigin && response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(function(cache){
            cache.put(request, copy);
          });
        }
        return response;
      }).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
