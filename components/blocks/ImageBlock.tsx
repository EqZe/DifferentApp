
import React from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType } from 'react-native';
import { spacing, radius, typography } from '@/styles/designSystem';

interface ImageBlockProps {
  data: {
    url: string;
    caption?: string;
  };
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: radius.lg,
    backgroundColor: '#f0f0f0',
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

export function ImageBlock({ data }: ImageBlockProps) {
  const imageUrl = data.url;
  const caption = data.caption;

  return (
    <View style={styles.container}>
      <Image
        source={resolveImageSource(imageUrl)}
        style={styles.image}
        resizeMode="cover"
      />
      {caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}
