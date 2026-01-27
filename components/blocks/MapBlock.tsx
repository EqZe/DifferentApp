
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/IconSymbol';
import { designColors, typography, spacing, radius } from '@/styles/designSystem';

interface MapBlockProps {
  data: {
    latitude: number;
    longitude: number;
    title?: string;
    description?: string;
  };
  isLocked?: boolean;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 250,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mapPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.body,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
  },
});

export function MapBlock({ data, isLocked = false }: MapBlockProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? designColors.dark : designColors.light;
  
  console.log('MapBlock: Rendering with isLocked:', isLocked, 'coords:', data.latitude, data.longitude);
  
  return (
    <View style={styles.container}>
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
        <IconSymbol
          ios_icon_name="map"
          android_material_icon_name="map"
          size={48}
          color={colors.textTertiary}
        />
        <Text style={[styles.placeholderText, { color: colors.textTertiary }]}>
          מפות אינן נתמכות ב-Natively כרגע
        </Text>
        {data.title && (
          <Text style={[styles.placeholderText, { color: colors.text, marginTop: spacing.xs }]}>
            {data.title}
          </Text>
        )}
      </View>
      {isLocked && (
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={styles.blurOverlay}
        />
      )}
    </View>
  );
}
