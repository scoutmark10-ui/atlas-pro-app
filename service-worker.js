const CACHE_NAME = 'atlas-pro-v2'; // Incremente a versão quando mudar os arquivos
const DYNAMIC_CACHE = 'atlas-pro-dynamic-v1';

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
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Instalação completa');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Erro na instalação:', error);
      })
  );
});

// Ativação
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    Promise.all([
      // Limpar caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Reivindicar controle imediatamente
      self.clients.claim()
    ]).then(() => {
      console.log('Service Worker: Ativação completa');
    })
  );
});

// Estratégia: Stale-While-Revalidate com fallback
self.addEventListener('fetch', event => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de análise e extensões do Chrome
  const url = new URL(event.request.url);
  if (url.pathname.includes('analytics') || 
      url.pathname.includes('chrome-extension')) return;
  
  // Estratégia para diferentes tipos de recursos
  if (event.request.mode === 'navigate') {
    // Páginas HTML: Network First com fallback para cache
    event.respondWith(networkFirstWithFallback(event.request));
  } else if (url.origin === location.origin) {
    // Recursos locais: Cache First com atualização em background
    event.respondWith(cacheFirstWithUpdate(event.request));
  } else {
    // Recursos externos (CDN): Stale-While-Revalidate
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

// Estratégia: Network First com fallback
async function networkFirstWithFallback(request) {
  try {
    // Tenta buscar da rede primeiro
    const networkResponse = await fetch(request);
    
    // Se sucesso, atualiza o cache
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Falha na rede, buscando cache para:', request.url);
    
    // Se falhou, tenta o cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não tem no cache, mostra página offline
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // Para outros recursos, retorna resposta vazia
    return new Response('Recurso não disponível offline', {
      status: 408,
      statusText: 'Offline',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Estratégia: Cache First com atualização
async function cacheFirstWithUpdate(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Atualiza o cache em segundo plano
    updateCache(request);
    return cachedResponse;
  }
  
  // Se não está no cache, busca da rede
  return fetchAndCache(request);
}

// Estratégia: Stale-While-Revalidate para CDN
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const networkPromise = fetchAndCache(request).catch(error => {
    console.log('Service Worker: Falha ao buscar da rede:', request.url);
    return null;
  });
  
  return cachedResponse || networkPromise;
}

// Função auxiliar: Busca e armazena em cache
async function fetchAndCache(request) {
  const networkResponse = await fetch(request);
  
  if (networkResponse && networkResponse.status === 200) {
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Função auxiliar: Atualiza cache em segundo plano
async function updateCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      console.log('Service Worker: Cache atualizado para:', request.url);
    }
  } catch (error) {
    console.log('Service Worker: Falha ao atualizar cache:', request.url);
  }
}

// Sincronização em background
self.addEventListener('sync', event => {
  console.log('Service Worker: Evento sync recebido:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  } else if (event.tag === 'sync-metrics') {
    event.waitUntil(syncMetrics());
  }
});

// Sincronizar dados gerais
async function syncData() {
  console.log('Service Worker: Sincronizando dados...');
  
  try {
    // Aqui você pode implementar a lógica de sincronização
    // Por exemplo: enviar dados do IndexedDB para o servidor
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Dados sincronizados com sucesso!',
        timestamp: new Date().toISOString()
      });
    });
    
    console.log('Service Worker: Sincronização completa');
    return true;
  } catch (error) {
    console.error('Service Worker: Erro na sincronização:', error);
    return false;
  }
}

// Sincronizar métricas específicas
async function syncMetrics() {
  console.log('Service Worker: Sincronizando métricas...');
  
  try {
    // Lógica específica para métricas
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'METRICS_SYNC_COMPLETE',
        message: 'Métricas sincronizadas!'
      });
    });
    
    return true;
  } catch (error) {
    console.error('Service Worker: Erro na sincronização de métricas:', error);
    return false;
  }
}

// Push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push recebido');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação',
    icon: '/assets/icons/atlas-icon-192x192.png',
    badge: '/assets/icons/atlas-icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Atlas Pro', options)
  );
});

// Click em notificação
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notificação clicada');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});     });
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

// Lidar com protocol handlers
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Lidar com protocolo personalizado
    if (url.protocol === 'web+atlas:') {
        event.respondWith(handleProtocol(url));
    }
});

async function handleProtocol(url) {
    const command = url.searchParams.get('command');
    // Processar comando
    return Response.redirect('/handle-command?cmd=' + command);
}

// Lidar com file handlers
self.addEventListener('fetch', event => {
    if (event.request.url.includes('/open-file')) {
        event.respondWith(handleFileOpen(event.request));
    }
});
