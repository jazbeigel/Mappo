import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import FeatureActionButton from '../../components/FeatureActionButton';
import {
  getFirebaseStorage,
  getFirestoreInstance,
  isFirebaseConfigValid,
  requiredFirebaseKeys,
} from './firebaseConfig';

export default function FirebaseFeature() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [firestoreCollections, setFirestoreCollections] = useState([]);

  const infoSections = useMemo(
    () => [
      {
        title: '¿Qué es Firebase?',
        body:
          'Firebase es una plataforma de Google que ofrece servicios backend listos para integrarse en aplicaciones móviles y web. Simplifica la autenticación, la sincronización de datos en tiempo real, el almacenamiento de archivos y el envío de notificaciones push.',
      },
      {
        title: 'Servicios clave',
        body:
          'Los servicios más utilizados son Authentication, Cloud Firestore, Realtime Database, Cloud Storage, Hosting y Firebase Cloud Messaging (FCM). En este módulo trabajamos con Cloud Storage para subir archivos y consultamos datos en Firestore.',
      },
      {
        title: 'MongoDB vs Firestore',
        body:
          'Firestore es una base de datos NoSQL orientada a documentos, similar a MongoDB. Ambas almacenan datos en colecciones y documentos flexibles. MongoDB es una base de datos independiente que puedes alojar donde prefieras, mientras que Firestore está totalmente gestionada por Google y optimizada para integrarse con el resto del ecosistema Firebase.',
      },
    ],
    []
  );

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file);
      setDownloadUrl('');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No pudimos seleccionar el archivo.');
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      Alert.alert('Selecciona un archivo', 'Elige un archivo antes de subirlo.');
      return;
    }

    if (!isFirebaseConfigValid) {
      Alert.alert(
        'Configura Firebase',
        'Completa las variables EXPO_PUBLIC_FIREBASE_* para habilitar la subida de archivos.'
      );
      return;
    }

    try {
      setUploading(true);
      const storage = getFirebaseStorage();
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `uploads/${Date.now()}-${selectedFile.name ?? 'archivo'}`);
      await uploadBytes(storageRef, blob, {
        contentType: selectedFile.mimeType ?? 'application/octet-stream',
      });
      const url = await getDownloadURL(storageRef);
      setDownloadUrl(url);
      Alert.alert('Archivo subido', 'El archivo se almacenó correctamente en Cloud Storage.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No pudimos subir el archivo. Revisa tus credenciales y conexión.');
    } finally {
      setUploading(false);
    }
  };

  const loadFirestoreCollections = async () => {
    if (!isFirebaseConfigValid) {
      Alert.alert('Configura Firebase', 'Agrega tus credenciales para consultar Firestore.');
      return;
    }

    try {
      const firestore = getFirestoreInstance();
      const snapshot = await getDocs(query(collection(firestore, 'demo'), limit(5)));
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setFirestoreCollections(docs);
      if (!docs.length) {
        Alert.alert(
          'Colección vacía',
          'Crea documentos en la colección "demo" para visualizarlos aquí.'
        );
      }
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error al consultar',
        'No se pudieron obtener los documentos. Verifica tu base de datos y las reglas de seguridad.'
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Integración con Firebase</Text>
      <Text style={styles.description}>
        Este módulo explica cómo configurar Firebase y demuestra la subida de archivos a Cloud
        Storage, además de consultar datos desde Cloud Firestore. Asegúrate de definir las variables
        EXPO_PUBLIC_FIREBASE_* en tu proyecto Expo para inicializar correctamente el SDK.
      </Text>

      {!isFirebaseConfigValid && (
        <View style={styles.warning}>
          <Text style={styles.warningTitle}>Configuración pendiente</Text>
          <Text style={styles.warningText}>
            Añade los siguientes valores al archivo app.config o a tus variables de entorno:
          </Text>
          {requiredFirebaseKeys.map((key) => (
            <Text key={key} style={styles.warningItem}>
              • {key}
            </Text>
          ))}
          <Text style={styles.warningText}>
            Obtén las credenciales en la consola de Firebase &gt; Configuración del proyecto &gt;
            Tus apps.
          </Text>
        </View>
      )}

      {infoSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionBody}>{section.body}</Text>
        </View>
      ))}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subir archivo a Cloud Storage</Text>
        <Text style={styles.sectionBody}>
          Selecciona un archivo del dispositivo y súbelo al bucket configurado. Firebase maneja la
          replicación y la entrega optimizada para ambos sistemas operativos.
        </Text>

        <View style={styles.actions}>
          <FeatureActionButton label="Elegir archivo" onPress={pickFile} color="#fbbf24" />
          <FeatureActionButton
            label={uploading ? 'Subiendo...' : 'Subir a Firebase'}
            onPress={uploadFile}
            color="#f97316"
          />
        </View>

        {selectedFile && (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Archivo seleccionado</Text>
            <Text style={styles.resultValue}>{selectedFile.name}</Text>
          </View>
        )}

        {downloadUrl ? (
          <Pressable onPress={() => Linking.openURL(downloadUrl)} style={styles.resultBox}>
            <Text style={styles.resultLabel}>URL descargable</Text>
            <Text style={[styles.resultValue, styles.link]} numberOfLines={2}>
              {downloadUrl}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Consultar documentos en Firestore</Text>
        <Text style={styles.sectionBody}>
          La colección <Text style={styles.code}>demo</Text> se utiliza a modo de ejemplo. Añade
          documentos en Firestore y consulta los primeros registros disponibles.
        </Text>
        <FeatureActionButton label="Cargar documentos" onPress={loadFirestoreCollections} color="#6366f1" />
        {firestoreCollections.map((doc) => (
          <View key={doc.id} style={styles.resultBox}>
            <Text style={styles.resultLabel}>{doc.id}</Text>
            <Text style={styles.resultValue}>{JSON.stringify(doc, null, 2)}</Text>
          </View>
        ))}
      </View>
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
  warning: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fb7185',
    gap: 6,
  },
  warningTitle: {
    color: '#fb7185',
    fontWeight: '700',
  },
  warningText: {
    color: '#f8fafc',
  },
  warningItem: {
    color: '#f8fafc',
    fontSize: 12,
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
  actions: {
    gap: 12,
  },
  resultBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  resultLabel: {
    color: '#38bdf8',
    fontWeight: '600',
  },
  resultValue: {
    color: '#f8fafc',
    marginTop: 6,
  },
  link: {
    color: '#38bdf8',
    textDecorationLine: 'underline',
  },
  code: {
    fontFamily: 'Courier',
    backgroundColor: '#0f172a',
    paddingHorizontal: 4,
    borderRadius: 4,
    color: '#eab308',
  },
});
