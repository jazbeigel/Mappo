import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';
import { storage } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';

export default function CameraFeature() {
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [gallery, setGallery] = useState([]);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const storageRef = ref(storage, 'photos/');
      const result = await listAll(storageRef);
      const urls = await Promise.all(result.items.map((imgRef) => getDownloadURL(imgRef)));
      setGallery(urls.reverse());
    } catch (error) {
      console.log('Error cargando galería:', error);
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const data = await cameraRef.current.takePictureAsync();
      setPhoto(data.uri);
    }
  };

  const savePhoto = async () => {
    try {
      const response = await fetch(photo);
      const blob = await response.blob();
      const fileName = `photo_${Date.now()}.jpg`;
      const storageRef = ref(storage, `photos/${fileName}`);
      await uploadBytes(storageRef, blob);
      await fetchGallery();
      alert('📸 Foto subida correctamente');
      setPhoto(null);
    } catch (error) {
      console.log('Error subiendo la foto:', error);
    }
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false)
    return <Text style={{ color: 'white', textAlign: 'center' }}>No hay acceso a la cámara</Text>;

  return (
    <View style={styles.container}>
      {!photo ? (
        <Camera style={styles.camera} ref={cameraRef} />
      ) : (
        <Image source={{ uri: photo }} style={styles.preview} />
      )}
      <View style={styles.controls}>
        {!photo ? (
          <TouchableOpacity onPress={takePhoto} style={styles.button}>
            <Text style={styles.text}>Tomar foto</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity onPress={savePhoto} style={styles.button}>
              <Text style={styles.text}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPhoto(null)} style={styles.button}>
              <Text style={styles.text}>Cancelar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={styles.galleryTitle}>Galería</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryContainer}>
        {gallery.length === 0 ? (
          <Text style={styles.emptyText}>No hay fotos guardadas</Text>
        ) : (
          gallery.map((url, i) => <Image key={i} source={{ uri: url }} style={styles.galleryImage} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  controls: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  button: { backgroundColor: '#38bdf8', padding: 10, borderRadius: 10 },
  text: { color: '#fff', fontWeight: '600' },
  preview: { flex: 1, borderRadius: 20 },
  galleryTitle: { color: '#f8fafc', fontSize: 18, marginVertical: 10, fontWeight: 'bold' },
  galleryContainer: { flexDirection: 'row', gap: 10 },
  galleryImage: { width: 100, height: 100, borderRadius: 10 },
  emptyText: { color: '#cbd5f5' },
});
