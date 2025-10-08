import { api } from '@/lib/api';

interface PushSubscriptionJSON {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const notification = {
    async setupNotification(): Promise<PushSubscriptionJSON | null> {
        if (!('serviceWorker' in navigator && 'PushManager' in window)) {
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            await navigator.serviceWorker.ready;
            
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.warn('Permissão para notificações foi negada.');
                return null;
            }

            const subscription = await this.registerPushInServiceWorker(registration);

            if (subscription) {
                await this.saveSubscription(subscription);
            }

            return subscription;

        } catch (error) {
            console.error('Falha na configuração das notificações:', error);
            throw error;
        }
    },

    /**
     * @param registration
     * @returns
     */
    async registerPushInServiceWorker(registration: ServiceWorkerRegistration): Promise<PushSubscriptionJSON> {
        return new Promise((resolve, reject) => {
            if (!registration.active) {
                return reject(new Error('Service Worker não está ativo.'));
            }

            const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY;

            if (!vapidPublicKey) {
                const errorMsg = 'VAPID public key não encontrada. Verifique se EXPO_PUBLIC_VAPID_PUBLIC_KEY está definida no .env';
                console.error(errorMsg);
                return reject(new Error(errorMsg));
            }

            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.success) {
                    resolve(event.data.subscription);
                } else {
                    console.error('Service Worker falhou ao registrar o push:', event.data.error);
                    reject(new Error(event.data.error));
                }
            };

            registration.active.postMessage(
                { 
                    type: 'REGISTER_PUSH',
                    publicKey: vapidPublicKey, 
                },
                [messageChannel.port2]
            );
        });
    },
    
    /**
     * @param subscription
     */
    async saveSubscription(subscription: PushSubscriptionJSON){
        if (!subscription) {
            console.warn("Nenhuma subscription de push para salvar.");
            return;
        }
                
        try {
            const response = await api.post("/push-subscription", {
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys.p256dh,
                    auth: subscription.keys.auth,
                },
            });
        } catch (error) {
            console.error("Erro ao salvar subscription no backend:", error);
        }
    },
    
    async isPushSupported(): Promise<boolean> {
        return 'serviceWorker' in navigator && 'PushManager' in window;
    },
    
    async getCurrentSubscription() {
        const registration = await navigator.serviceWorker.ready;
        return await registration.pushManager.getSubscription();
    }
}