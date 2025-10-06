import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

export default function FeatureActionButton({ label, onPress, color }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: color,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  label: {
    color: '#0b1120',
    fontWeight: '700',
    fontSize: 16,
  },
});
