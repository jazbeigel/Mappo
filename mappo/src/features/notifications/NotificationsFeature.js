import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import FeatureActionButton from '../../components/FeatureActionButton';

const pushDocsUrl = 'https://firebase.google.com/docs/cloud-messaging';
const apnsDocsUrl = 'https://developer.apple.com/documentation/usernotifications';

export default function NotificationsFeature() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [targetToken, setTargetToken] = useState('');
  const [loadingToken, setLoadingToken] = useState(false);
  const [message, setMessage] = useState('Hola desde Mappo ✈️');

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    try {
      setLoadingToken(true);
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Permiso requerido', 'Activa las notificaciones para recibir alertas.');
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const tokenResponse = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      const token = tokenResponse.data;
      setExpoPushToken(token);
      setTargetToken(token);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No pudimos obtener el token de notificaciones.');
    } finally {
      setLoadingToken(false);
    }
  };

  const sendPushNotification = async () => {
    if (!targetToken) {
      Alert.alert('Token requerido', 'Introduce un token de dispositivo válido.');
      return;
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: targetToken,
          sound: 'default',
          title: 'Mensaje directo',
          body: message,
          data: { customData: 'Información adicional' },
        }),
      });

      if (response.ok) {
        Alert.alert('Notificación enviada', 'Revisa el dispositivo objetivo para verla.');
      } else {
        const errorData = await response.json();
        console.error(errorData);
        Alert.alert('Error', 'El servicio de envío devolvió un error.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No fue posible contactar al servicio de notificaciones.');
    }
  };

  const infoSections = useMemo(
    () => [
      {
        title: 'Consideraciones de configuración',
        body:
          'Para iOS necesitas un perfil de APNs válido (desarrollo y producción) y registrar los certificados en Firebase o en tu servidor. En Android debes configurar FCM y obtener el token del remitente (Sender ID) y la clave del servidor.',
      },
      {
        title: 'Entornos y credenciales',
        body:
          'Define variables por entorno (dev y prod). En Expo, utiliza projectId para generar tokens estables. Si trabajas con apps nativas, registra las claves de APNs en Apple Developer y el archivo google-services.json / GoogleService-Info.plist.',
      },
      {
        title: 'Envío a usuarios específicos',
        body:
          'Guarda el token expo o FCM de cada usuario en tu backend. Desde ahí puedes invocar el servicio de FCM o APNs para enviar notificaciones personalizadas. Este ejemplo usa el endpoint de Expo para simplificar pruebas locales.',
      },
    ],
    []
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Notificaciones push</Text>
      <Text style={styles.description}>
        Solicita permisos, obtiene el token Expo (compatible con FCM y APNs) y envía mensajes de
        prueba. Reemplaza el token con el de otro dispositivo para enviarle una notificación
        específica.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Token del dispositivo</Text>
        <Text style={styles.sectionBody}>
          {loadingToken
            ? 'Solicitando permisos y token...'
            : expoPushToken || 'Aún no se obtuvo un token.'}
        </Text>
        <FeatureActionButton label="Actualizar token" onPress={registerForPushNotificationsAsync} color="#38bdf8" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enviar a un usuario</Text>
        <TextInput
          value={targetToken}
          onChangeText={setTargetToken}
          placeholder="Expo push token"
          placeholderTextColor="#64748b"
          style={styles.input}
          multiline
        />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Mensaje a enviar"
          placeholderTextColor="#64748b"
          style={[styles.input, styles.messageInput]}
          multiline
        />
        <FeatureActionButton label="Enviar notificación" onPress={sendPushNotification} color="#22c55e" />
      </View>

      {infoSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}

      <View style={styles.links}>
        <Text style={styles.linksTitle}>Documentación recomendada</Text>
        <Text style={styles.link} onPress={() => Linking.openURL(pushDocsUrl)}>
          Guía oficial de Firebase Cloud Messaging (FCM)
        </Text>
        <Text style={styles.link} onPress={() => Linking.openURL(apnsDocsUrl)}>
          Apple Push Notification Service (APNs)
        </Text>
      </View>

      <Text style={styles.footer}>
        Tip: para probar con dispositivos físicos agrega el proyecto a Expo Notifications, sube tus
        credenciales de APNs y FCM, y utiliza un backend seguro para distribuir los tokens.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    gap: 20,
  },
  title: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: '#cbd5f5',
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 18,
    fontWeight: '600',
  },
  sectionBody: {
    color: '#cbd5f5',
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  messageInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  links: {
    gap: 8,
  },
  linksTitle: {
    color: '#e2e8f0',
    fontWeight: '600',
  },
  link: {
    color: '#38bdf8',
    textDecorationLine: 'underline',
  },
  footer: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
});
