
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface HtmlBlockProps {
  data: {
    content: string;
  };
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});

export function HtmlBlock({ data }: HtmlBlockProps) {
  const [webViewHeight, setWebViewHeight] = useState(200);
  
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
          overflow-x: hidden;
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

  return (
    <View style={[styles.container, { height: webViewHeight }]}>
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
    </View>
  );
}
