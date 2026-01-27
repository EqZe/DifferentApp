
import React from 'react';
import { View, Image, StyleSheet, ScrollView, ImageSourcePropType, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import { spacing, radius } from '@/styles/designSystem';

interface GalleryBlockProps {
  data: {
    images: Array<{
      url: string;
      alt?: string;
    }>;
  };
  isLocked?: boolean;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    paddingRight: spacing.md,
  },
  imageContainer: {
    marginLeft: spacing.md,
    position: 'relative',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 200,
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

export function GalleryBlock({ data, isLocked = false }: GalleryBlockProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const images = data.images || [];
  
  console.log('GalleryBlock: Rendering with isLocked:', isLocked, 'images:', images.length);
  
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={resolveImageSource(image.url)}
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
        ))}
      </ScrollView>
    </View>
  );
}
