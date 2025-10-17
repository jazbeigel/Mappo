import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import CommunicationsFeature from './src/features/communications/CommunicationsFeature';
import FirebaseFeature from './src/features/firebase/FirebaseFeature';
import CalendarFeature from './src/features/calendar/CalendarFeature';
import ScanerFeature from './src/features/scanerQR/ScanerFeature';
import CameraFeature from './src/features/camera/CameraFeature';

const palette = {
  background: '#0f172a',
  card: '#1e293b',
  accent: '#38bdf8',
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5f5',
  border: '#334155',
};

const FEATURES = [
  {
    key: 'communications',
    title: 'Comunicaciones',
    description: 'Llamar, SMS y WhatsApp',
    component: CommunicationsFeature,
  },
  {
    key: 'firebase',
    title: 'Firebase',
    description: 'Subida de archivos y base de datos',
    component: FirebaseFeature,
  },
  {
    key: 'camera',
    title: 'Cámara',
    description: 'Acceso a la cámara del dispositivo',
    component: CameraFeature,
  },
  {
    key: 'calendar',
    title: 'Calendario',
    description: 'Eventos y programación',
    component: CalendarFeature,
  },
  {
    key: 'scaner',
    title: 'Scaner',
    description: 'Acceso a la camara para scaner de QRs',
    component: ScanerFeature,
  },
];

export default function App() {
  const [activeFeatureKey, setActiveFeatureKey] = useState(FEATURES[0].key);

  const ActiveFeature = useMemo(() => {
    const selected = FEATURES.find((feature) => feature.key === activeFeatureKey);
    return selected?.component ?? CommunicationsFeature;
  }, [activeFeatureKey]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.container}>
        <Text style={styles.heading}>Mappo Toolkit</Text>
        <Text style={styles.subheading}>
          Elige una funcionalidad para probarla en iOS y Android. Cada módulo está separado y optimizado.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          {FEATURES.map((feature) => {
            const isActive = feature.key === activeFeatureKey;
            return (
              <TouchableOpacity
                key={feature.key}
                onPress={() => setActiveFeatureKey(feature.key)}
                style={[styles.tab, isActive && styles.tabActive]}
              >
                <Text style={[styles.tabTitle, isActive && styles.tabTitleActive]}>
                  {feature.title}
                </Text>
                <Text style={[styles.tabSubtitle, isActive && styles.tabSubtitleActive]}>
                  {feature.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.featureContainer}>
          <ActiveFeature />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  heading: {
    color: palette.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subheading: {
    color: palette.textSecondary,
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 16,
  },
  tabs: {
    paddingVertical: 12,
    gap: 12,
  },
  tab: {
    backgroundColor: palette.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    width: 200,
    borderWidth: 1,
    borderColor: palette.border,
  },
  tabActive: {
    borderColor: palette.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  tabTitle: {
    color: palette.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  tabTitleActive: {
    color: palette.textPrimary,
  },
  tabSubtitle: {
    color: palette.textSecondary,
    marginTop: 6,
    fontSize: 12,
  },
  tabSubtitleActive: {
    color: palette.textPrimary,
  },
  featureContainer: {
    flex: 1,
    marginTop: 16,
    backgroundColor: '#0b1120',
    marginBottom:30,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
});
