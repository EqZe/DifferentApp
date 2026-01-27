
import React from 'react';
import { View, Image, Text, StyleSheet, ScrollView, ImageSourcePropType } from 'react-native';
import { BlurView } from 'expo-blur';
import { spacing, radius, typography } from '@/styles/designSystem';

interface GalleryImage {
  url: string;
  caption?: string;
}

interface GalleryBlockProps {
  data: {
    images: GalleryImage[];
  };
  isLocked?: boolean;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollView: {
    paddingVertical: spacing.xs,
  },
  imageContainer: {
    marginRight: spacing.md,
    width: 200,
    position: 'relative',
  },
  image: {
    width: 200,
    height: 150,
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
    marginTop: spacing.xs,
    ...typography.caption,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

export function GalleryBlock({ data, isLocked = false }: GalleryBlockProps) {
  const images = data.images || [];

  console.log('GalleryBlock: Rendering with isLocked:', isLocked, 'images:', images.length);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollView}
      >
        {images.map((image, index) => (
          <View key={index} style={styles.imageContainer}>
            <Image
              source={resolveImageSource(image.url)}
              style={styles.image}
              resizeMode="cover"
            />
            {isLocked && (
              <View style={styles.blurOverlay}>
                <BlurView intensity={80} style={{ flex: 1 }} tint="light" />
              </View>
            )}
            {image.caption && (
              <Text style={styles.caption}>{image.caption}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
