const CACHE_NAME = 'atlas-pro-v1';
const urlsToCache = [
 '/',
 '/index.html',
 '/login.html',
 '/metrics.html',
 '/goals.html',
 '/settings.html',
 '/offline.html',
 '/css/style.css',
 '/js/app.js',
 '/manifest.json',
 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
 'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalação
self.addEventListener('install', event => {
 event.waitUntil(
  caches.open(CACHE_NAME)
  .then(cache => {
   console.log('Cache aberto');
   return cache.addAll(urlsToCache);
  })
  .then(() => self.skipWaiting())
 );
});

// Ativação
self.addEventListener('activate', event => {
 event.waitUntil(
  caches.keys().then(cacheNames => {
   return Promise.all(
    cacheNames.map(cacheName => {
     if (cacheName !== CACHE_NAME) {
      console.log('Cache antigo removido:', cacheName);
      return caches.delete(cacheName);
     }
    })
   );
  }).then(() => self.clients.claim())
 );
});

// Estratégia de cache: Stale-While-Revalidate
self.addEventListener('fetch', event => {
 // Ignorar requisições que não são GET
 if (event.request.method !== 'GET') return;
 
 // Ignorar requisições de análise
 if (event.request.url.includes('analytics')) return;
 
 event.respondWith(
  caches.match(event.request)
  .then(response => {
   // Retorna do cache se encontrado
   if (response) {
    // Atualiza o cache em segundo plano
    fetch(event.request)
     .then(networkResponse => {
      if (networkResponse && networkResponse.status === 200) {
       const responseToCache = networkResponse.clone();
       caches.open(CACHE_NAME)
        .then(cache => {
         cache.put(event.request, responseToCache);
        });
      }
     })
     .catch(() => {});
    
    return response;
   }
   
   // Se não está no cache, busca da rede
   return fetch(event.request)
    .then(networkResponse => {
     // Verifica se a resposta é válida
     if (!networkResponse || networkResponse.status !== 200) {
      return networkResponse;
     }
     
     // Clona a resposta para cache
     const responseToCache = networkResponse.clone();
     caches.open(CACHE_NAME)
      .then(cache => {
       cache.put(event.request, responseToCache);
      });
     
     return networkResponse;
    })
    .catch(() => {
     // Se falhou e é uma requisição de página, mostra offline.html
     if (event.request.mode === 'navigate') {
      return caches.match('/offline.html');
     }
     
     // Para outros recursos, retorna uma resposta vazia
     return new Response('', {
      status: 408,
      statusText: 'Offline'
     });
    });
  })
 );
});

// Sincronização em background
self.addEventListener('sync', event => {
 if (event.tag === 'sync-data') {
  event.waitUntil(syncData());
 }
});

async function syncData() {
 try {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  // Sincroniza dados pendentes
  console.log('Sincronizando dados...');
  
  // Notificar o cliente
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
   client.postMessage({
    type: 'SYNC_COMPLETE',
    message: 'Dados sincronizados com sucesso!'
   });
  });
 } catch (error) {
  console.error('Erro na sincronização:', error);
 }
}