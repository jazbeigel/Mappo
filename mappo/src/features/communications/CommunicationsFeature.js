import React, { useMemo, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import FeatureActionButton from '../../components/FeatureActionButton';

const DEFAULT_MESSAGE =
  'Hola, me gustaría recibir más información sobre las experiencias disponibles.';

export default function CommunicationsFeature() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const sanitizedNumber = useMemo(() => phoneNumber.replace(/[^0-9+]/g, ''), [phoneNumber]);

  const ensurePhoneNumber = () => {
    if (!sanitizedNumber || sanitizedNumber.length < 6) {
      Alert.alert('Número inválido', 'Ingresa un número de teléfono válido.');
      return false;
    }
    return true;
  };

  const handleCall = async () => {
    if (!ensurePhoneNumber()) {
      return;
    }
    const url = `tel:${sanitizedNumber}`;
    await openCommunicationUrl(url, 'Tu dispositivo no puede realizar llamadas.');
  };

  const handleSms = async () => {
    if (!ensurePhoneNumber()) {
      return;
    }
    const body = encodeURIComponent(message);
    const url = Platform.select({
      ios: `sms:&addresses=${sanitizedNumber}&body=${body}`,
      default: `sms:${sanitizedNumber}?body=${body}`,
    });
    await openCommunicationUrl(url, 'Tu dispositivo no puede enviar SMS.');
  };

  const handleWhatsapp = async () => {
    if (!ensurePhoneNumber()) {
      return;
    }
    const encodedMessage = encodeURIComponent(message);
    const schemeUrl = `whatsapp://send?phone=${sanitizedNumber}&text=${encodedMessage}`;
    const universalUrl = `https://wa.me/${sanitizedNumber}?text=${encodedMessage}`;

    if (await Linking.canOpenURL(schemeUrl)) {
      await Linking.openURL(schemeUrl);
      return;
    }

    await openCommunicationUrl(
      universalUrl,
      'Instala WhatsApp o verifica tu conexión para enviar el mensaje.'
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comunicaciones directas</Text>
      <Text style={styles.description}>
        Ingresa un número telefónico y utiliza las acciones disponibles para contactar a un
        usuario mediante llamada, SMS o WhatsApp. El módulo utiliza enlaces nativos compatibles con
        iOS y Android.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Número telefónico</Text>
        <TextInput
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          placeholder="Ej. +34123456789"
          placeholderTextColor="#94a3b8"
          style={styles.input}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Mensaje</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Escribe un mensaje breve"
          placeholderTextColor="#94a3b8"
          style={[styles.input, styles.messageInput]}
          multiline
        />
      </View>

      <View style={styles.actions}>
        <FeatureActionButton label="Llamar" onPress={handleCall} color="#22d3ee" />
        <FeatureActionButton label="Enviar SMS" onPress={handleSms} color="#38bdf8" />
        <FeatureActionButton label="Mensaje WhatsApp" onPress={handleWhatsapp} color="#22c55e" />
      </View>

      <Text style={styles.helper}>
        Consejo: en Android se utiliza el intent nativo y en iOS los esquemas de URL integrados. Si
        la acción falla, verifica que el dispositivo tenga la app o el servicio disponible.
      </Text>
    </View>
  );
}

async function openCommunicationUrl(url, fallbackMessage) {
  const supported = await Linking.canOpenURL(url);
  if (!supported) {
    Alert.alert('Acción no disponible', fallbackMessage);
    return;
  }

  try {
    await Linking.openURL(url);
  } catch (error) {
    console.error(error);
    Alert.alert('Error', 'No pudimos completar la acción.');
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
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
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#111827',
    color: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actions: {
    gap: 12,
  },
  helper: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
});
