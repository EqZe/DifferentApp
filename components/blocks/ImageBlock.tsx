
import React from 'react';
import { View, Image, Text, StyleSheet, ImageSourcePropType } from 'react-native';

interface ImageBlockProps {
  data: {
    url: string;
    caption?: string;
  };
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  caption: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
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
