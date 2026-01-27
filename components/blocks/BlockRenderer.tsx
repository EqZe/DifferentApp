
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PostBlock } from '@/utils/api';
import { TextBlock } from './TextBlock';
import { ImageBlock } from './ImageBlock';
import { GalleryBlock } from './GalleryBlock';
import { HtmlBlock } from './HtmlBlock';
import { MapBlock } from './MapBlock';
import { spacing, radius, typography } from '@/styles/designSystem';

interface BlockRendererProps {
  block: PostBlock;
  isLocked?: boolean;
  isPreview?: boolean;
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: spacing.md,
    backgroundColor: '#fee',
    borderRadius: radius.md,
  },
  errorText: {
    ...typography.body,
    color: '#c00',
  },
});

export function BlockRenderer({ block, isLocked = false, isPreview = false }: BlockRendererProps) {
  console.log('BlockRenderer: Rendering block', block.type, 'order:', block.order, 'isLocked:', isLocked, 'isPreview:', isPreview);

  try {
    switch (block.type) {
      case 'text':
        console.log('BlockRenderer: Rendering TextBlock with isLocked:', isLocked, 'isPreview:', isPreview);
        return <TextBlock data={block.data} isLocked={isLocked} isPreview={isPreview} />;
      
      case 'image':
        console.log('BlockRenderer: Rendering ImageBlock with isLocked:', isLocked);
        return <ImageBlock data={block.data} isLocked={isLocked} />;
      
      case 'gallery':
        console.log('BlockRenderer: Rendering GalleryBlock with isLocked:', isLocked);
        return <GalleryBlock data={block.data} isLocked={isLocked} />;
      
      case 'html':
        console.log('BlockRenderer: Rendering HtmlBlock with isLocked:', isLocked, 'isPreview:', isPreview);
        return <HtmlBlock data={block.data} isLocked={isLocked} isPreview={isPreview} />;
      
      case 'map':
        console.log('BlockRenderer: Rendering MapBlock with isLocked:', isLocked);
        return <MapBlock data={block.data} isLocked={isLocked} />;
      
      default:
        console.warn('BlockRenderer: Unknown block type:', block.type);
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              סוג בלוק לא נתמך: {block.type}
            </Text>
          </View>
        );
    }
  } catch (error) {
    console.error('BlockRenderer: Error rendering block:', error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          שגיאה בטעינת התוכן
        </Text>
      </View>
    );
  }
}
