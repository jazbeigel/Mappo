import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import FeatureActionButton from '../../components/FeatureActionButton';

const isProbablyUrl = (raw) => {
  if (!raw) return false;
  const withScheme = /^(https?:\/\/)/i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    // Tiene dominio y TLD
    return !!u.hostname && u.hostname.includes('.');
  } catch {
    return false;
  }
};

export default function QRScannerFeature() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const scanningLockRef = useRef(false); // evita múltiples triggers por frame

  const toggleScanner = useCallback(() => {
    setIsScanning((prev) => !prev);
    if (!isScanning) {
      scanningLockRef.current = false;
    }
  }, [isScanning]);

  const openUrl = useCallback(async (raw) => {
    if (!raw) return;

    const url = /^(https?:\/\/)/i.test(raw) ? raw : `https://${raw}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        Alert.alert('No se pudo abrir el enlace', url);
      }
    } catch (e) {
      Alert.alert('Error al abrir el enlace', String(e?.message ?? e));
    }
  }, []);

  const onBarcodeScanned = useCallback(
    ({ data, type }) => {
      if (scanningLockRef.current) return;
      scanningLockRef.current = true;

      setLastScan({ data, type });

      if (isProbablyUrl(data)) {
        openUrl(data);
      } else {
        Alert.alert('QR detectado', 'No parece un enlace válido:\n' + data);
      }

      setTimeout(() => {
        scanningLockRef.current = false;
      }, 1200);
    },
    [openUrl]
  );

  const grantCamera = useCallback(async () => {
    const { granted } = await requestPermission();
    if (!granted) {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear códigos.');
    }
  }, [requestPermission]);


  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Escáner QR</Text>
        <Text style={styles.description}>Preparando permisos de cámara…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Escáner QR</Text>
        <Text style={styles.description}>
          Necesitamos acceso a la cámara para escanear menús, guías y otros QR.
        </Text>
        <FeatureActionButton label="Conceder permiso de cámara" onPress={grantCamera} color="#38bdf8" margin="29px" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Escáner QR</Text>
      <Text style={styles.description}>
        Apunta al código QR de un menú, guía turística o cualquier enlace. Si es un link, se abrirá
        automáticamente en el navegador predeterminado.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cámara</Text>

        <View style={styles.cameraWrapper}>
          {isScanning ? (
            <CameraView
              style={styles.camera}
              onBarcodeScanned={onBarcodeScanned}
               barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            />
          ) : (
            <View style={[styles.camera, styles.cameraPlaceholder]}>
              <Text style={styles.placeholderText}>Escáner en pausa</Text>
            </View>
          )}
        </View>

        <FeatureActionButton
          label={isScanning ? 'Pausar escáner' : 'Iniciar escáner'}
          onPress={toggleScanner}
          color={isScanning ? '#f59e0b' : '#22c55e'}
        />
      </View>

      {lastScan && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Último resultado</Text>
          <Text style={styles.sectionBody} selectable>
            {lastScan.data}
          </Text>
          <FeatureActionButton label="Abrir enlace nuevamente" onPress={() => openUrl(lastScan.data)} color="#38bdf8" />
        </View>
      )}

      <Text style={styles.footer}>
        Tip: Si el QR no incluye "http/https", intentaremos abrirlo igual agregando "https://".
        En Web, necesitás origen seguro (https) para usar la cámara.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 32,
    gap: 20,
  },
  center: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
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
  cameraWrapper: {
    overflow: 'hidden',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  camera: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  cameraPlaceholder: {
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#64748b',
  },
  footer: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
  },
});
