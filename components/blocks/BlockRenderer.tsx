
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PostBlock } from '@/utils/api';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { GalleryBlock } from './GalleryBlock';
import { HtmlBlock } from './HtmlBlock';
import { MapBlock } from './MapBlock';

interface BlockRendererProps {
  block: PostBlock;
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 16,
    backgroundColor: '#fee',
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    color: '#c00',
    fontSize: 14,
  },
});

export function BlockRenderer({ block }: BlockRendererProps) {
  console.log('Rendering block:', block.type, block.order);

  try {
    switch (block.type) {
      case 'text':
        return <TextBlock data={block.data} />;
      
      case 'image':
        return <ImageBlock data={block.data} />;
      
      case 'gallery':
        return <GalleryBlock data={block.data} />;
      
      case 'html':
        return <HtmlBlock data={block.data} />;
      
      case 'map':
        return <MapBlock data={block.data} />;
      
      default:
        console.warn('Unknown block type:', block.type);
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              סוג בלוק לא נתמך: {block.type}
            </Text>
          </View>
        );
    }
  } catch (error) {
    console.error('Error rendering block:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          שגיאה בטעינת התוכן
        </Text>
      </View>
    );
  }
}
