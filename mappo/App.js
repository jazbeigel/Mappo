import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as Calendar from 'expo-calendar';
import { CameraView, useCameraPermissions } from 'expo-camera';

const palette = {
  blue: '#4285F4',
  red: '#DB4437',
  yellow: '#F4B400',
  green: '#0F9D58',
  dark: '#1F1F1F',
  light: '#F9FAFB',
};

const contactInfo = {
  phone: '+34911223344',
  smsMessage:
    'Hola, estoy interesado en recibir más información turística de Mappo.',
  whatsappMessage:
    '¡Hola! Quiero recomendaciones personalizadas para mi próxima aventura con Mappo.',
};

export default function App() {
  const [hasBarCodePermission, setHasBarCodePermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasBarCodePermission(status === 'granted');
    })();
  }, []);

  const handleCall = async () => {
    const url = `tel:${contactInfo.phone}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No disponible', 'Tu dispositivo no puede realizar llamadas.');
    }
  };

  const handleSms = async () => {
    const body = encodeURIComponent(contactInfo.smsMessage);
    const url = `sms:${contactInfo.phone}?body=${body}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No disponible', 'Tu dispositivo no puede enviar SMS.');
    }
  };

  const handleWhatsapp = async () => {
    const message = encodeURIComponent(contactInfo.whatsappMessage);
    const schemeUrl = `whatsapp://send?phone=${contactInfo.phone}&text=${message}`;
    const canOpenScheme = await Linking.canOpenURL(schemeUrl);
    if (canOpenScheme) {
      await Linking.openURL(schemeUrl);
      return;
    }

    const universalUrl = `https://wa.me/${contactInfo.phone}?text=${message}`;
    const canOpenUniversal = await Linking.canOpenURL(universalUrl);
    if (canOpenUniversal) {
      await Linking.openURL(universalUrl);
    } else {
      Alert.alert(
        'WhatsApp no disponible',
        'Instala WhatsApp para contactar a nuestro equipo de experiencias.'
      );
    }
  };

  const openScanner = () => {
    if (!hasBarCodePermission) {
      Alert.alert(
        'Permiso requerido',
        'Activa el permiso de cámara para poder escanear códigos.'
      );
      return;
    }
    setScannedData(null);
    setIsScanning(true);
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScannedData({ type, data });
    setIsScanning(false);
    Alert.alert('Código detectado', `Tipo: ${type}\nDato: ${data}`);
  };

  const handleAddEvent = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Activa los permisos del calendario para guardar tus aventuras.'
        );
        return;
      }

      let calendarId;
      if (Platform.OS === 'ios' && Calendar.getDefaultCalendarAsync) {
        const defaultCalendar = await Calendar.getDefaultCalendarAsync();
        calendarId = defaultCalendar?.id;
      } else {
        const calendars = await Calendar.getCalendarsAsync(
          Calendar.EntityTypes.EVENT
        );
        calendarId = calendars.find((cal) => cal.isPrimary)?.id ?? calendars[0]?.id;
      }

      if (!calendarId) {
        Alert.alert(
          'Sin calendario',
          'No se encontró un calendario disponible en tu dispositivo.'
        );
        return;
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 2);

      await Calendar.createEventAsync(calendarId, {
        title: 'Tour guiado con Mappo',
        location: 'Punto de encuentro Mappo, Centro Histórico',
        notes:
          'Recorrido cultural con recomendaciones personalizadas de Mappo.',
        startDate,
        endDate,
        timeZone: undefined,
      });

      Alert.alert('¡Listo!', 'Tu próximo recorrido quedó agendado.');
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error inesperado',
        'No pudimos crear el evento, intenta nuevamente más tarde.'
      );
    }
  };

  const openCamera = async () => {
    const permission = cameraPermission?.granted
      ? cameraPermission
      : await requestCameraPermission();

    if (permission?.granted) {
      setIsCameraOpen(true);
    } else {
      Alert.alert(
        'Permiso requerido',
        'Activa el permiso de cámara para capturar tus momentos con Mappo.'
      );
    }
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current) {
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      setIsCameraOpen(false);
      Alert.alert('Foto lista', 'Guardamos tu último recuerdo de viaje.');
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error al capturar',
        'No pudimos tomar la foto, intenta nuevamente.'
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
          }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.title}>Mappo</Text>
            <Text style={styles.subtitle}>
              Tu compañero de viajes para descubrir, planear y capturar tus mejores
              experiencias.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conecta con nuestro equipo</Text>
          <Text style={styles.sectionDescription}>
            Estamos listos para ayudarte a crear itinerarios inolvidables. Usa el
            canal que prefieras para hablar con un asesor Mappo.
          </Text>

          <View style={styles.actionsRow}>
            <FeatureButton
              color={palette.blue}
              label="Llamar"
              description="Habla con un concierge local"
              onPress={handleCall}
            />
            <FeatureButton
              color={palette.green}
              label="SMS"
              description="Recibe sugerencias al instante"
              onPress={handleSms}
            />
          </View>
          <FeatureButton
            color={palette.yellow}
            label="WhatsApp"
            description="Comparte tus planes y recibe tips"
            onPress={handleWhatsapp}
            fullWidth
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explora con tu cámara</Text>
          <Text style={styles.sectionDescription}>
            Escanea códigos QR en museos, rutas gastronómicas y experiencias
            exclusivas para desbloquear contenido adicional.
          </Text>

          <FeatureButton
            color={palette.red}
            label="Escanear QR / Código"
            description="Accede a promociones y guías interactivas"
            onPress={openScanner}
            fullWidth
          />
          {scannedData && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Último código escaneado</Text>
              <Text style={styles.resultText}>
                Tipo: <Text style={styles.bold}>{scannedData.type}</Text>
              </Text>
              <Text style={styles.resultText}>{scannedData.data}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organiza tu aventura</Text>
          <Text style={styles.sectionDescription}>
            Guarda las actividades seleccionadas directamente en tu calendario para
            no perder ningún detalle del viaje.
          </Text>

          <FeatureButton
            color={palette.green}
            label="Guardar en calendario"
            description="Programa tu próxima experiencia"
            onPress={handleAddEvent}
            fullWidth
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Captura recuerdos</Text>
          <Text style={styles.sectionDescription}>
            Usa la cámara para inmortalizar cada momento y compártelo con tus
            compañeros de viaje.
          </Text>

          <FeatureButton
            color={palette.blue}
            label="Abrir cámara"
            description="Toma una foto panorámica"
            onPress={openCamera}
            fullWidth
          />

          {photoUri && (
            <View style={styles.photoPreview}>
              <Text style={styles.resultTitle}>Última fotografía</Text>
              <Image source={{ uri: photoUri }} style={styles.photo} />
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={isScanning} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Escanea un código</Text>
          <View style={styles.scannerWrapper}>
            <BarCodeScanner
              style={StyleSheet.absoluteFillObject}
              onBarCodeScanned={handleBarCodeScanned}
            />
          </View>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: palette.red }]}
            onPress={() => setIsScanning(false)}
          >
            <Text style={styles.modalButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal visible={isCameraOpen} animationType="fade">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Captura tu experiencia</Text>
          <View style={styles.cameraWrapper}>
            <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} />
          </View>
          <View style={styles.cameraActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: palette.yellow }]}
              onPress={handleTakePhoto}
            >
              <Text style={[styles.modalButtonText, { color: palette.dark }]}>Tomar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: palette.dark }]}
              onPress={() => setIsCameraOpen(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function FeatureButton({ label, description, onPress, color, fullWidth = false }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.featureButton,
        { backgroundColor: color },
        fullWidth && styles.featureButtonFull,
      ]}
    >
      <Text style={styles.featureLabel}>{label}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.light,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48,
  },
  hero: {
    height: 280,
    justifyContent: 'flex-end',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    backgroundColor: 'rgba(31, 31, 31, 0.55)',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 2,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  section: {
    marginHorizontal: 24,
    marginTop: 32,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: palette.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: palette.dark,
  },
  sectionDescription: {
    marginTop: 8,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  featureButton: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
  },
  featureButtonFull: {
    marginTop: 16,
  },
  featureLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  featureDescription: {
    marginTop: 6,
    color: '#fff',
    opacity: 0.85,
  },
  resultCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: palette.light,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.25)',
  },
  resultTitle: {
    fontWeight: '700',
    marginBottom: 4,
    color: palette.dark,
  },
  resultText: {
    color: '#4A4A4A',
    marginTop: 4,
  },
  bold: {
    fontWeight: '700',
  },
  photoPreview: {
    marginTop: 16,
    alignItems: 'center',
  },
  photo: {
    marginTop: 12,
    width: '100%',
    height: 220,
    borderRadius: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: palette.dark,
    paddingTop: 64,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  scannerWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalButton: {
    marginTop: 24,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
});
