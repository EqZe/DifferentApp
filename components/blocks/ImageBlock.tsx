
import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { radius } from '@/styles/designSystem';

interface ImageBlockProps {
  data: {
    url: string;
    alt?: string;
    caption?: string;
  };
  isLocked?: boolean;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: radius.lg,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.lg,
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export function ImageBlock({ data, isLocked = false }: ImageBlockProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  console.log('ImageBlock: Rendering with isLocked:', isLocked, 'url:', data.url);
  
  return (
    <View style={styles.container}>
      <Image
        source={resolveImageSource(data.url)}
        style={styles.image}
        resizeMode="cover"
      />
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
