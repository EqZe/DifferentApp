
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface HtmlBlockProps {
  data: {
    content: string;
  };
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  webview: {
    backgroundColor: 'transparent',
  },
});

export function HtmlBlock({ data }: HtmlBlockProps) {
  const htmlContent = data.content;
  
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
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  const contentHeight = htmlContent.length * 0.4;
  const estimatedHeight = Math.max(80, Math.min(contentHeight, 600));

  return (
    <View style={[styles.container, { height: estimatedHeight }]}>
      <WebView
        source={{ html: htmlTemplate }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
      />
    </View>
  );
}
