import React, { useEffect, useMemo, useRef, useState } from 'react';
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

const experiencePackages = [
  {
    id: 'historic-walk',
    title: 'Ruta histórica por el casco antiguo',
    description:
      'Descubre los rincones secretos, historias locales y arquitectura emblemática con un guía especializado.',
    image:
      'https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?auto=format&fit=crop&w=1200&q=80',
    meetingPoint: 'Plaza Mayor - Punto de información Mappo',
    durationHours: 3,
    recommendations: ['Incluye degustación gastronómica', 'Grupos reducidos', 'Guía bilingüe'],
  },
  {
    id: 'nature-escape',
    title: 'Escapada natural a los miradores',
    description:
      'Conecta con la naturaleza mientras visitas los mejores miradores panorámicos y reservas naturales de la región.',
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80',
    meetingPoint: 'Terminal Mappo Adventure - Andén 3',
    durationHours: 5,
    recommendations: ['Incluye transporte ida y vuelta', 'Kit de snacks saludables', 'Fotógrafo profesional opcional'],
  },
  {
    id: 'gastro-tour',
    title: 'Tour gastronómico de sabores locales',
    description:
      'Un viaje culinario por mercados, restaurantes y cafeterías de autor con maridajes y relatos de cada chef.',
    image:
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    meetingPoint: 'Mercado Central - Entrada principal',
    durationHours: 4,
    recommendations: ['Incluye 7 paradas gastronómicas', 'Opciones veganas disponibles', 'Recetas descargables'],
  },
];

export default function App() {
  const [hasBarCodePermission, setHasBarCodePermission] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const cameraRef = useRef(null);

  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isScheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

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

  const ensureCalendarAccess = async () => {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Activa los permisos del calendario para guardar tus aventuras.'
        );
        return null;
      }

      if (
        Platform.OS === 'android' &&
        (await Calendar.requestRemindersPermissionsAsync?.())?.status ===
          'denied'
      ) {
        // En algunos dispositivos Android se requiere permiso de recordatorios.
      }

      let calendars = await Calendar.getCalendarsAsync(
        Calendar.EntityTypes.EVENT
      );
      const editableCalendar = calendars.find(
        (calendar) => calendar.allowsModifications
      );
      if (editableCalendar) {
        return editableCalendar.id;
      }

      let defaultCalendar = null;
      if (Platform.OS === 'ios' && Calendar.getDefaultCalendarAsync) {
        defaultCalendar = await Calendar.getDefaultCalendarAsync();
        if (defaultCalendar?.allowsModifications) {
          return defaultCalendar.id;
        }
      }

      const calendarSource =
        defaultCalendar?.source ?? calendars.find((cal) => cal.source)?.source;

      if (!calendarSource && Platform.OS === 'ios') {
        Alert.alert(
          'Sin calendario editable',
          'Añade o sincroniza un calendario editable en tu dispositivo.'
        );
        return null;
      }

      const calendarConfig = {
        title: 'Mappo',
        color: palette.blue,
        entityType: Calendar.EntityTypes.EVENT,
        name: 'Experiencias Mappo',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
        ownerAccount: 'personal',
      };

      if (Platform.OS === 'ios') {
        calendarConfig.sourceId = calendarSource?.id;
      } else {
        calendarConfig.source =
          calendarSource ?? { isLocalAccount: true, name: 'Mappo' };
      }

      const newCalendarId = await Calendar.createCalendarAsync(calendarConfig);

      calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const createdCalendar = calendars.find(
        (calendar) => calendar.id === newCalendarId
      );
      return createdCalendar?.id ?? null;
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error de calendario',
        'No pudimos acceder al calendario del dispositivo. Intenta nuevamente.'
      );
      return null;
    }
  };

  const getDateWithOffset = (offsetDays, hour) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  const getNextWeekdayDate = (weekday, hour) => {
    const date = new Date();
    const current = date.getDay();
    let delta = weekday - current;
    if (delta <= 0) {
      delta += 7;
    }
    date.setDate(date.getDate() + delta);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  const scheduleOptions = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const tomorrow = getDateWithOffset(1, 10);
    const nextSaturday = getNextWeekdayDate(6, 9);
    const nextWednesday = getNextWeekdayDate(3, 17);

    return [
      {
        id: 'tomorrow',
        label: `Mañana (${formatter.format(tomorrow)}) · 10:00`,
        startDate: tomorrow,
      },
      {
        id: 'weekend',
        label: `Próximo sábado (${formatter.format(nextSaturday)}) · 09:00`,
        startDate: nextSaturday,
      },
      {
        id: 'sunset',
        label: `Tarde cultural (${formatter.format(nextWednesday)}) · 17:00`,
        startDate: nextWednesday,
      },
    ];
  }, [isScheduleModalVisible]);

  const handleSchedulePackage = (selected) => {
    setSelectedPackage(selected);
    setScheduleModalVisible(true);
  };

  const closeScheduleModal = () => {
    setScheduleModalVisible(false);
    setSelectedPackage(null);
  };

  const handleCreateEvent = async (option) => {
    if (!selectedPackage) {
      return;
    }

    setIsCreatingEvent(true);
    try {
      const calendarId = await ensureCalendarAccess();
      if (!calendarId) {
        return;
      }

      const startDate = option.startDate;
      const endDate = new Date(startDate.getTime());
      endDate.setHours(
        endDate.getHours() + (selectedPackage.durationHours ?? 2)
      );

      await Calendar.createEventAsync(calendarId, {
        title: selectedPackage.title,
        location: selectedPackage.meetingPoint,
        notes: `${selectedPackage.description}\n\nRecomendaciones: ${selectedPackage.recommendations.join(
          ' · '
        )}`,
        startDate,
        endDate,
        alarms: [
          {
            relativeOffset: -60,
            method: Calendar.AlarmMethod.ALERT,
          },
        ],
      });

      Alert.alert(
        '¡Experiencia agendada!',
        `${selectedPackage.title} se agregó a tu calendario.`
      );
      closeScheduleModal();
    } catch (error) {
      console.error(error);
      Alert.alert(
        'No se pudo agendar',
        'Ocurrió un problema al crear el evento. Intenta nuevamente.'
      );
    } finally {
      setIsCreatingEvent(false);
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
          <Text style={styles.sectionTitle}>Paquetes recomendados</Text>
          <Text style={styles.sectionDescription}>
            Elige la experiencia que mejor se adapte a tu viaje y agrégala al
            calendario con un solo toque.
          </Text>

          {experiencePackages.map((travelPackage) => (
            <PackageCard
              key={travelPackage.id}
              data={travelPackage}
              onSchedule={() => handleSchedulePackage(travelPackage)}
            />
          ))}
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

      <Modal visible={isScheduleModalVisible} animationType="slide" transparent>
        <View style={styles.overlayModalContainer}>
          <View style={styles.scheduleModal}>
            <Text style={[styles.modalTitle, { color: palette.dark }]}>Programar experiencia</Text>
            {selectedPackage && (
              <View style={styles.selectedPackageInfo}>
                <Image
                  source={{ uri: selectedPackage.image }}
                  style={styles.selectedPackageImage}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.packageTitle}>{selectedPackage.title}</Text>
                  <Text style={styles.selectedPackageDescription}>
                    {selectedPackage.meetingPoint}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.scheduleOptionsTitle}>Elige un horario sugerido</Text>
            {scheduleOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[styles.scheduleOption, { borderColor: palette.blue }]}
                onPress={() => handleCreateEvent(option)}
                disabled={isCreatingEvent}
              >
                <Text style={styles.scheduleOptionLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: palette.dark }]}
              onPress={closeScheduleModal}
              disabled={isCreatingEvent}
            >
              <Text style={styles.modalButtonText}>
                {isCreatingEvent ? 'Guardando...' : 'Cerrar'}
              </Text>
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

function PackageCard({ data, onSchedule }) {
  return (
    <View style={styles.packageCard}>
      <Image source={{ uri: data.image }} style={styles.packageImage} />
      <View style={styles.packageContent}>
        <Text style={styles.packageTitle}>{data.title}</Text>
        <Text style={styles.packageDescription}>{data.description}</Text>
        <View style={styles.packageBadges}>
          {data.recommendations.map((item) => (
            <View key={item} style={styles.packageBadge}>
              <Text style={styles.packageBadgeText}>{item}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.scheduleButton, { backgroundColor: palette.green }]}
          onPress={onSchedule}
        >
          <Text style={styles.scheduleButtonText}>Agregar al calendario</Text>
        </TouchableOpacity>
      </View>
    </View>
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
  packageCard: {
    marginTop: 20,
    borderRadius: 24,
    backgroundColor: palette.light,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.1)',
  },
  packageImage: {
    width: '100%',
    height: 160,
  },
  packageContent: {
    padding: 20,
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.dark,
  },
  packageDescription: {
    marginTop: 8,
    color: '#4A4A4A',
    lineHeight: 20,
  },
  packageBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  packageBadge: {
    backgroundColor: 'rgba(66, 133, 244, 0.12)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  packageBadgeText: {
    color: palette.blue,
    fontSize: 12,
    fontWeight: '600',
  },
  scheduleButton: {
    marginTop: 18,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  scheduleButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
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
  overlayModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scheduleModal: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
  },
  selectedPackageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  selectedPackageImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  selectedPackageDescription: {
    marginTop: 4,
    color: '#4A4A4A',
  },
  scheduleOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: palette.dark,
    marginBottom: 12,
  },
  scheduleOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  scheduleOptionLabel: {
    fontWeight: '600',
    color: palette.dark,
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
});
