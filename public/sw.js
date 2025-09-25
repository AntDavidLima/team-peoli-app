self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker ativado');
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    showNotification(event.data);
  }
});

function showNotification(data) {
  const title = data.title || 'Notificação do App';
  const options = {
    body: data.body || 'Nova mensagem',
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'app-notification',
    timestamp: data.timestamp ? new Date(data.timestamp).getTime() : Date.now()
  };

  self.registration.showNotification(title, options)
    .then(() => console.log('Notificação exibida via Service Worker'))
    .catch(error => console.error('Erro ao exibir notificação:', error));
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === self.registration.scope && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (self.clients.openWindow) {
        return self.clients.openWindow(self.registration.scope);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event.notification.tag);
});