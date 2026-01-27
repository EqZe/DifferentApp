
import React from 'react';
import { View, Image, Text, StyleSheet, ScrollView, ImageSourcePropType } from 'react-native';

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
    marginVertical: 12,
  },
  scrollView: {
    paddingVertical: 4,
  },
  imageContainer: {
    marginRight: 12,
    width: 200,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  caption: {
    marginTop: 6,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
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
