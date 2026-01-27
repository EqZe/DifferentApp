
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface TextBlockProps {
  data: {
    html: string;
  };
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  webview: {
    backgroundColor: 'transparent',
  },
});

export function TextBlock({ data }: TextBlockProps) {
  const htmlContent = data.html;
  
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
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          padding: 0;
          background: transparent;
        }
        h1, h2, h3, h4, h5, h6 {
          margin: 16px 0 12px 0;
          color: #2784F5;
          font-weight: 600;
        }
        h1 { font-size: 28px; }
        h2 { font-size: 24px; }
        h3 { font-size: 20px; }
        p {
          margin: 8px 0;
        }
        ul, ol {
          margin: 12px 0;
          padding-right: 24px;
        }
        li {
          margin: 6px 0;
        }
        a {
          color: #2784F5;
          text-decoration: none;
        }
        strong {
          font-weight: 600;
        }
        em {
          font-style: italic;
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  const contentHeight = htmlContent.length * 0.5;
  const estimatedHeight = Math.max(100, Math.min(contentHeight, 800));

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
