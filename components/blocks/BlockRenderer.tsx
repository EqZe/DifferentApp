
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
  console.log('Rendering block:', block.type, block.order, 'locked:', isLocked, 'preview:', isPreview);

  try {
    switch (block.type) {
      case 'text':
        return <TextBlock data={block.data} isLocked={isLocked} isPreview={isPreview} />;
      
      case 'image':
        return <ImageBlock data={block.data} isLocked={isLocked} />;
      
      case 'gallery':
        return <GalleryBlock data={block.data} isLocked={isLocked} />;
      
      case 'html':
        return <HtmlBlock data={block.data} isLocked={isLocked} isPreview={isPreview} />;
      
      case 'map':
        return <MapBlock data={block.data} isLocked={isLocked} />;
      
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
