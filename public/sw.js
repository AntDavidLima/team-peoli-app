self.addEventListener('push', function(event) {
  const data = event.data?.json() ?? {};
  showNotification(data);
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULED_NOTIFICATION') {
    showNotification(event.data);
  }
});

function showNotification(data) {
  const title = data.title || 'Notificação PWA';
  const options = {
    body: data.body || 'Nova mensagem',
    icon: data.icon || '/icon.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    requireInteraction: true,
    tag: data.tag || 'general'
  };

  self.registration.showNotification(title, options);
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url === self.registration.scope && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(self.registration.scope);
      }
    })
  );
});