let restTimerId = null;

self.addEventListener('message', event => {
    console.log('[Service Worker] Mensagem recebida:', event.data);
    
    if (event.data && event.data.type === 'START_REST_TIMER') {
        if (restTimerId) {
            clearTimeout(restTimerId);
        }

        const durationInMs = event.data.duration * 1000;
        
        restTimerId = setTimeout(() => {
            self.registration.showNotification('Descanso Finalizado!', {
                body: 'Hora de voltar ao treino!',
                icon: '/icon-192x192.png',
                badge: '/icon-192x192.png',
                vibrate: [200, 100, 200],
                tag: 'rest-timer-notification',
            });
        }, durationInMs);
    }

    if (event.data && event.data.type === 'CANCEL_REST_TIMER') {
        if (restTimerId) {
            clearTimeout(restTimerId);
            restTimerId = null;
        }
    }
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installed.');
});

self.addEventListener('fetch', (event) => {
});