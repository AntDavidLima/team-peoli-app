import { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import Toast from "react-native-toast-message";

const scheduledTimers: NodeJS.Timeout[] = [];

function isStandalonePWA(): boolean {
  if (Platform.OS !== 'web') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

async function showNotification(options: { 
  title: string; 
  body: string;
  requireInteraction?: boolean;
}) {
  if (Platform.OS !== 'web') {
    Toast.show({
      type: 'error',
      text1: 'Este recurso só funciona em navegadores',
    });
    return;
  }

  console.log('Tentando mostrar notificação...', { isPWA: isStandalonePWA() });

  if (isStandalonePWA() || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return showNotificationViaServiceWorker(options);
  } else {
    return showNotificationDirect(options);
  }
}

async function showNotificationViaServiceWorker(options: { title: string; body: string; requireInteraction?: boolean }) {
  try {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      throw new Error('Service Worker ou Notifications não suportados');
    }

    const registration = await navigator.serviceWorker.ready;
    
    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão negada para notificações');
      }
    }

    registration.active?.postMessage({
      type: 'SHOW_NOTIFICATION',
      title: options.title,
      body: options.body,
      requireInteraction: options.requireInteraction || false,
      timestamp: new Date().toISOString()
    });

    console.log('Notificação enviada para Service Worker');
    return true;

  } catch (error) {
    console.error('Erro com Service Worker, tentando método direto:', error);
    return showNotificationDirect(options);
  }
}

async function showNotificationDirect(options: { title: string; body: string; requireInteraction?: boolean }) {
  if (!('Notification' in window)) {
    throw new Error('Notifications não suportados neste navegador');
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão negada para notificações');
    }
  }

  if (typeof Notification !== 'undefined') {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: '/icon.png',
      badge: '/badge.png',
      requireInteraction: options.requireInteraction || false,
      tag: 'app-notification'
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 8000);
    }

    return notification;
  } else {
    throw new Error('Notification API não disponível');
  }
}

async function testNotification(options?: { 
  delay?: number; 
  title?: string; 
  body?: string;
}) {
  if (Platform.OS !== 'web') {
    throw new Error('Apenas para ambiente web');
  }

  const sendNotification = async () => {
    await showNotification({
      title: options?.title || '🔔 Notificação de Teste',
      body: options?.body || `Enviada em: ${new Date().toLocaleTimeString()}`,
      requireInteraction: true
    });
  };

  if (options?.delay && options.delay > 0) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        try {
          await sendNotification();
          resolve(true);
        } catch (error) {
          reject(error);
        }
      }, options.delay! * 1000);
      
      scheduledTimers.push(timer);
    });
  } else {
    return sendNotification();
  }
}

async function scheduleBackgroundNotification(delayMinutes: number) {
  if (Platform.OS !== 'web') {
    throw new Error('Apenas para ambiente web');
  }

  return new Promise((resolve) => {
    const timer = setTimeout(async () => {
      try {
        await testNotification({
          title: '📅 Notificação Agendada',
          body: `Programada há ${delayMinutes} minuto(s) atrás!\nHora: ${new Date().toLocaleTimeString()}`
        });
        resolve(true);
      } catch (error) {
        console.error('Erro na notificação agendada:', error);
        resolve(false);
      }
    }, delayMinutes * 60 * 1000);

    scheduledTimers.push(timer);
  });
}

function cancelAllScheduledNotifications() {
  scheduledTimers.forEach(timer => clearTimeout(timer));
  scheduledTimers.length = 0;
}

function checkNotificationSupport() {
  if (Platform.OS !== 'web') return false;
  
  const supportsNotifications = 'Notification' in window;
  const supportsServiceWorker = 'serviceWorker' in navigator;
  
  console.log('Suporte a notificações:', supportsNotifications);
  console.log('Suporte a Service Worker:', supportsServiceWorker);
  console.log('É PWA standalone?', isStandalonePWA());
  console.log('User Agent:', navigator.userAgent);
  
  return supportsNotifications || supportsServiceWorker;
}

async function requestNotificationPermission() {
  if (Platform.OS !== 'web') {
    return 'granted';
  }

  try {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission;
      }
      return Notification.permission;
    }
    return 'denied';
  } catch (error) {
    console.error('Erro ao solicitar permissão:', error);
    return 'denied';
  }
}

export default function notificationTest() {

  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  const [isSupported, setIsSupported] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [delayMinutes, setDelayMinutes] = useState(1);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (Platform.OS !== 'web') {
        setIsSupported(false);
        return;
      }

      const supported = checkNotificationSupport();
      setIsSupported(supported);
      setIsPWA(isStandalonePWA());

      if (supported) {
        const permission = await requestNotificationPermission();
        setNotificationPermission(permission);
        
        if (isStandalonePWA()) {
          try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registrado para PWA');
          } catch (error) {
            console.error('Erro ao registrar Service Worker:', error);
          }
        }
      }
    };

    init();

    return () => {
      cancelAllScheduledNotifications();
    };
  }, []);

  const handleTestNotification = async () => {
    setIsTesting(true);
    try {
      await testNotification({
        title: '🚀 Teste de Notificação',
        body: `Modo: ${isPWA ? 'PWA' : 'Navegador'}\nHora: ${new Date().toLocaleTimeString()}`
      });
      
      Toast.show({
        type: 'success',
        text1: 'Notificação enviada!',
        text2: `Modo: ${isPWA ? 'PWA (Service Worker)' : 'Navegador'}`
      });
    } catch (error: any) {
      console.error('Erro no teste:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao enviar notificação',
        text2: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleScheduleNotification = async () => {
    if (delayMinutes < 1 || delayMinutes > 60) {
      Toast.show({
        type: 'error',
        text1: 'O tempo deve ser entre 1 e 60 minutos'
      });
      return;
    }

    setIsTesting(true);
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        throw new Error('Permissão para notificações não concedida');
      }

      await scheduleBackgroundNotification(delayMinutes);
      setScheduledCount(prev => prev + 1);
      
      Toast.show({
        type: 'success',
        text1: 'Notificação agendada!',
        text2: `Chegará em ${delayMinutes} minuto(s) - minimize o app para testar`
      });

    } catch (error: any) {
      console.error('Erro ao agendar:', error);
      Toast.show({
        type: 'error',
        text1: 'Erro ao agendar notificação',
        text2: error.message || 'Erro desconhecido'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        Toast.show({
          type: 'success',
          text1: 'Permissão concedida!',
          text2: 'Agora você pode testar notificações'
        });
      } else if (permission === 'denied') {
        Toast.show({
          type: 'error',
          text1: 'Permissão negada',
          text2: 'Ative as notificações nas configurações do navegador'
        });
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    }
  };

  const NotificationDebugInfo = () => {
    if (Platform.OS !== 'web') {
      return (
        <View style={{ alignItems: 'center', padding: 10, marginTop: 20 }}>
          <Text style={{ color: '#ff6b6b', textAlign: 'center' }}>
            ⚠️ Notificações só funcionam em navegadores web/PWA
          </Text>
        </View>
      );
    }

    if (!isSupported) {
      return (
        <View style={{ alignItems: 'center', padding: 10, marginTop: 20 }}>
          <Text style={{ color: '#ff6b6b', textAlign: 'center' }}>
            ❌ Seu navegador não suporta notificações
          </Text>
        </View>
      );
    }

    return (
      <View style={{ alignItems: 'center', padding: 15, marginTop: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 }}>
        <Text style={{ color: 'white', marginBottom: 15, textAlign: 'center', fontSize: 16, fontWeight: 'bold' }}>
          🔔 Teste de Notificações
        </Text>
        
        <View style={{ marginBottom: 15, alignItems: 'center' }}>
          <Text style={{ color: 'white', marginBottom: 5 }}>
            Status: {notificationPermission === 'granted' ? '✅ Permitido' : 
                    notificationPermission === 'denied' ? '❌ Negado' : '⏳ Pendente'}
          </Text>
          
          <Text style={{ color: isPWA ? '#64ffda' : '#ffcc80', fontSize: 12 }}>
            Modo: {isPWA ? '📱 PWA Instalado' : '🌐 Navegador'}
          </Text>
          
          {scheduledCount > 0 && (
            <Text style={{ color: '#64ffda', fontSize: 12, marginTop: 5 }}>
              ⏰ {scheduledCount} notificação(ões) agendada(s)
            </Text>
          )}
        </View>

        {notificationPermission === 'granted' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
            <Text style={{ color: 'white', marginRight: 10 }}>⏱️ Agendar para:</Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                borderWidth: 1,
                borderColor: '#64A4EB',
                borderRadius: 5,
                padding: 8,
                width: 60,
                textAlign: 'center'
              }}
              value={String(delayMinutes)}
              onChangeText={(text) => {
                const num = parseInt(text) || 1;
                setDelayMinutes(Math.max(1, Math.min(60, num)));
              }}
              keyboardType="number-pad"
            />
            <Text style={{ color: 'white', marginLeft: 5 }}>minutos</Text>
          </View>
        )}

        <View style={{ gap: 10, width: '100%' }}>
          {notificationPermission !== 'granted' ? (
            <TouchableOpacity
              style={{
                backgroundColor: '#2196F3',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleRequestPermission}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                📢 Solicitar Permissão
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={{
                  backgroundColor: '#4CAF50',
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: isTesting ? 0.7 : 1,
                }}
                onPress={handleTestNotification}
                disabled={isTesting}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  {isTesting ? '🔄 Enviando...' : '🚀 Teste Imediato'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: '#FF9800',
                  paddingHorizontal: 15,
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  opacity: isTesting ? 0.7 : 1,
                }}
                onPress={handleScheduleNotification}
                disabled={isTesting}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>
                  {isTesting ? '🔄 Agendando...' : '⏰ Agendar Notificação'}
                </Text>
              </TouchableOpacity>

              {scheduledCount > 0 && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#f44336',
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    cancelAllScheduledNotifications();
                    setScheduledCount(0);
                    Toast.show({
                      type: 'info',
                      text1: 'Agendamentos cancelados'
                    });
                  }}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>❌ Cancelar Agendamentos</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={{ marginTop: 15, padding: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 5 }}>
          <Text style={{ color: '#ffcc80', fontSize: 11, textAlign: 'center' }}>
            {isPWA 
              ? '💡 Você está no modo PWA. Notificações usarão Service Worker.'
              : '💡 Para testar em background: agende, minimize e aguarde.'
            }
          </Text>
        </View>
      </View>
    );
  };

  return (
      <View>
        <NotificationDebugInfo />
      </View>
  );
  
}