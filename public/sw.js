const urlB64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let pushData = {
    title: 'Notificação',
    body: 'Algo novo aconteceu!',
  };

  if (event.data) {
    try {
      pushData = event.data.json();
    } catch (e) {
      console.error('O dado do push não era um JSON, usando texto.', e);
      pushData = { title: 'Notificação', body: event.data.text() };
    }
  }

  const title = pushData.title;
  const options = {
    body: pushData.body,
    icon: '/logo192.png',
  };

  const notificationPromise = self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  }).then((clientList) => {const isPageVisible = clientList.some(client => client.visibilityState === 'visible');

   return self.registration.showNotification(title, options);
  });

  event.waitUntil(notificationPromise);
});

async function registerPush(publicKey) {
  try {
    if (!publicKey) {
      throw new Error('VAPID Public Key não foi fornecida.');
    }
    const applicationServerKey = urlB64ToUint8Array(publicKey);
    
    const options = { 
      applicationServerKey, 
      userVisibleOnly: true 
    };
    
    const subscription = await self.registration.pushManager.subscribe(options);
    return subscription;
  } catch (err) {
    console.error('[SW] Erro dentro de registerPush:', err);
    throw err;
  }
}

self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'REGISTER_PUSH') {
    try {
      const subscription = await registerPush(event.data.publicKey);
      event.ports[0].postMessage({ success: true, subscription: subscription.toJSON() });
    } catch (error) {
      event.ports[0].postMessage({ success: false, error: error.message });
    }
  }
  
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    showNotification(event.data);
  }
});

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