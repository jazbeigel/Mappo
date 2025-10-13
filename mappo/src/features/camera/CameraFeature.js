import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Camera, CameraType } from 'expo-camera';

export default function CameraFeature() {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(CameraType.back);
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const picture = await cameraRef.current.takePictureAsync();
      setPhoto(picture.uri);
    }
  };

  if (hasPermission === null) {
    return <Text style={styles.text}>Solicitando permiso...</Text>;
  }

  if (hasPermission === false) {
    return <Text style={styles.text}>Acceso a la cámara denegado.</Text>;
  }

  return (
    <View style={styles.container}>
      {!photo ? (
        <Camera style={styles.camera} type={type} ref={cameraRef}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setType(type === CameraType.back ? CameraType.front : CameraType.back);
              }}
            >
              <Text style={styles.text}>Cambiar cámara</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      ) : (
        <Image source={{ uri: photo }} style={styles.preview} />
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={takePicture}>
          <Text style={styles.text}>Tomar foto</Text>
        </TouchableOpacity>

        {photo && (
          <TouchableOpacity style={styles.button} onPress={() => setPhoto(null)}>
            <Text style={styles.text}>Volver a cámara</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { width: '100%', height: 400, borderRadius: 20, overflow: 'hidden' },
  buttonContainer: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 20 },
  switchButton: {
    backgroundColor: '#38bdf8',
    padding: 10,
    borderRadius: 10,
  },
  controls: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, gap: 10 },
  button: { backgroundColor: '#1e293b', padding: 12, borderRadius: 10 },
  text: { color: '#f8fafc', fontWeight: '600' },
  preview: { width: '90%', height: 400, borderRadius: 20 },
});
