
import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

interface HtmlBlockProps {
  data: {
    content: string;
  };
  isLocked?: boolean;
  isPreview?: boolean;
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  webview: {
    backgroundColor: 'transparent',
  },
  previewContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    zIndex: 10,
  },
});

export function HtmlBlock({ data, isLocked = false, isPreview = false }: HtmlBlockProps) {
  const [webViewHeight, setWebViewHeight] = useState(200);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const htmlContent = data.content;
  
  console.log('HtmlBlock: Rendering with isLocked:', isLocked, 'isPreview:', isPreview, 'height:', webViewHeight);
  
  const htmlTemplate = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 0;
          background: transparent;
          overflow-x: hidden;
          color: ${isDark ? '#E2E8F0' : '#333'};
        }
      </style>
      <script>
        window.onload = function() {
          const height = document.body.scrollHeight;
          window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
        };
        
        // Update height when content changes
        const observer = new MutationObserver(() => {
          const height = document.body.scrollHeight;
          window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true
        });
      </script>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.height) {
        const newHeight = Math.max(80, data.height + 20);
        console.log('HtmlBlock: Setting height to', newHeight);
        setWebViewHeight(newHeight);
      }
    } catch (error) {
      console.error('HtmlBlock: Error parsing message', error);
    }
  };

  const shouldTruncate = isLocked && isPreview;
  const shouldBlur = isLocked && !isPreview;
  const displayHeight = shouldTruncate ? Math.min(webViewHeight, 150) : webViewHeight;

  console.log('HtmlBlock: shouldTruncate:', shouldTruncate, 'shouldBlur:', shouldBlur, 'displayHeight:', displayHeight);

  const gradientColors = isDark 
    ? ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.7)', 'rgba(15, 23, 42, 0.95)', '#0F172A']
    : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.95)', '#FFFFFF'];

  return (
    <View style={[styles.container, shouldTruncate && styles.previewContainer, { height: displayHeight }]}>
      <WebView
        source={{ html: htmlTemplate }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        onMessage={handleMessage}
        injectedJavaScript={`
          setTimeout(() => {
            const height = document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
          }, 100);
        `}
      />
      {shouldTruncate && (
        <LinearGradient
          colors={gradientColors}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      )}
      {shouldBlur && (
        <View style={styles.blurOverlay}>
          <BlurView intensity={60} style={{ flex: 1 }} tint={isDark ? 'dark' : 'light'} />
        </View>
      )}
    </View>
  );
}
