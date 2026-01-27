
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface TextBlockProps {
  data: {
    html: string;
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

export function TextBlock({ data }: TextBlockProps) {
  const [webViewHeight, setWebViewHeight] = useState(200);
  
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
          line-height: 1.8;
          color: #333;
          padding: 0;
          background: transparent;
          overflow-x: hidden;
        }
        h1, h2, h3, h4, h5, h6 {
          margin: 20px 0 16px 0;
          color: #2784F5;
          font-weight: 600;
          line-height: 1.3;
        }
        h1 { font-size: 28px; margin-top: 0; }
        h2 { font-size: 24px; }
        h3 { font-size: 20px; }
        p {
          margin: 12px 0;
          line-height: 1.8;
        }
        ul, ol {
          margin: 16px 0;
          padding-right: 24px;
        }
        li {
          margin: 8px 0;
          line-height: 1.6;
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
        blockquote {
          margin: 16px 0;
          padding: 12px 16px;
          border-right: 4px solid #2784F5;
          background: #f5f5f5;
          font-style: italic;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 16px 0;
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
        const newHeight = Math.max(100, data.height + 20);
        console.log('TextBlock: Setting height to', newHeight);
        setWebViewHeight(newHeight);
      }
    } catch (error) {
      console.error('TextBlock: Error parsing message', error);
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
