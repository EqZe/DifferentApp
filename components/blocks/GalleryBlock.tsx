
import React from 'react';
import { View, Image, Text, StyleSheet, ScrollView, ImageSourcePropType } from 'react-native';
import { spacing, radius, typography } from '@/styles/designSystem';

interface GalleryImage {
  url: string;
  caption?: string;
}

interface GalleryBlockProps {
  data: {
    images: GalleryImage[];
  };
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
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: '#f0f0f0',
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

export function GalleryBlock({ data }: GalleryBlockProps) {
  const images = data.images || [];

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
            {image.caption && (
              <Text style={styles.caption}>{image.caption}</Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
