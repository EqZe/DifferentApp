
import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import { LottieConfig } from '@/constants/LottieAnimations';

interface SafeLottieViewProps {
  config: LottieConfig;
  autoPlay?: boolean;
  loop?: boolean;
  style?: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'center';
  onError?: (error: Error) => void;
}

/**
 * SafeLottieView - A wrapper around LottieView with error handling
 * 
 * This component ensures that if a Lottie animation fails to load,
 * the app doesn't break and shows a fallback instead.
 */
export function SafeLottieView({
  config,
  autoPlay = true,
  loop = true,
  style,
  resizeMode = 'contain',
  onError,
}: SafeLottieViewProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleAnimationFailure = useCallback((error: any) => {
    console.error(`SafeLottieView: Failed to load animation for ${config.purpose}`, error);
    console.error(`SafeLottieView: URI was: ${config.uri}`);
    setHasError(true);
    setIsLoading(false);
    
    if (onError) {
      onError(error);
    }
  }, [config, onError]);

  const handleAnimationFinish = useCallback(() => {
    setIsLoading(false);
  }, []);

  // If animation failed to load, show a simple colored view as fallback
  if (hasError) {
    return (
      <View
        style={[
          style,
          styles.fallbackContainer,
          { backgroundColor: config.fallbackColor || '#2784F5' },
        ]}
      />
    );
  }

  return (
    <View style={[style, styles.container]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={config.fallbackColor || '#2784F5'} />
        </View>
      )}
      <LottieView
        source={{ uri: config.uri }}
        autoPlay={autoPlay}
        loop={loop}
        style={[StyleSheet.absoluteFill, style]}
        resizeMode={resizeMode}
        onAnimationFailure={handleAnimationFailure}
        onAnimationFinish={handleAnimationFinish}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fallbackContainer: {
    opacity: 0.3,
  },
});
