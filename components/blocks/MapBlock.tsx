
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { spacing, radius, typography } from '@/styles/designSystem';

interface MapBlockProps {
  data: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: '#f8f9fa',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  icon: {
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h4,
    color: '#333',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  address: {
    ...typography.body,
    color: '#2784F5',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export function MapBlock({ data }: MapBlockProps) {
  const address = data.address;

  return (
    <View style={styles.container}>
      <IconSymbol
        ios_icon_name="map"
        android_material_icon_name="map"
        size={48}
        color="#2784F5"
        style={styles.icon}
      />
      <Text style={styles.title}>מפה</Text>
      <Text style={styles.message}>
        react-native-maps אינו נתמך כרגע ב-Natively
      </Text>
      {address && <Text style={styles.address}>{address}</Text>}
    </View>
  );
}
