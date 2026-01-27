
import React from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { BlurView } from 'expo-blur';
import { spacing, radius, typography } from '@/styles/designSystem';

interface ImageBlockProps {
  data: {
    url: string;
    caption?: string;
  };
  isLocked?: boolean;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: radius.lg,
    backgroundColor: '#f0f0f0',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  caption: {
    marginTop: spacing.sm,
    ...typography.caption,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export function ImageBlock({ data, isLocked = false }: ImageBlockProps) {
  const imageUrl = data.url;
  const caption = data.caption;

  return (
    <View style={styles.container}>
      <Image
        source={resolveImageSource(imageUrl)}
        style={styles.image}
        resizeMode="cover"
      />
      {isLocked && (
        <View style={styles.blurOverlay}>
          <BlurView intensity={80} style={{ flex: 1 }} tint="light" />
        </View>
      )}
      {caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}
