
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';

interface MapBlockProps {
  data: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  address: {
    fontSize: 14,
    color: '#2784F5',
    marginTop: 8,
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
