
import React, { useState } from 'react';
import { View, StyleSheet, useColorScheme, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';

interface HtmlBlockProps {
  data: {
    html?: string;
    content?: string;
    body?: string;
    text?: string;
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

  const htmlContent = data?.html ?? data?.content ?? data?.body ?? data?.text ?? '';

  const htmlTemplate = `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 16px;
          line-height: 1.8;
          color: ${isDark ? '#E2E8F0' : '#333'};
          background: transparent;
          overflow-x: hidden;
          padding: 0;
        }

        /* ── Typography ── */
        h1, h2, h3, h4, h5, h6 {
          margin: 20px 0 16px 0;
          color: #2784F5;
          font-weight: 600;
          line-height: 1.3;
        }
        h1 { font-size: 28px; margin-top: 0; }
        h2 { font-size: 24px; }
        h3 { font-size: 20px; }
        p { margin: 12px 0; line-height: 1.8; }
        strong { font-weight: 700; }
        em { font-style: italic; }

        /* ── Lists ── */
        ul, ol { margin: 16px 0; padding-right: 24px; }
        li { margin: 8px 0; line-height: 1.6; }

        /* ── Blockquote ── */
        blockquote {
          margin: 16px 0;
          padding: 12px 16px;
          border-right: 4px solid #2784F5;
          background: ${isDark ? 'rgba(39,132,245,0.1)' : '#f5f5f5'};
          font-style: italic;
        }

        /* ── Images ── */
        img { max-width: 100%; height: auto; display: block; margin: 16px 0; }

        /* ── Tables ── */
        .table-wrapper { overflow-x: auto; margin: 16px 0; border-radius: 12px; border: 1px solid ${isDark ? '#334155' : '#e2e8f0'}; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th {
          background: ${isDark ? '#1e293b' : '#f1f5f9'};
          color: ${isDark ? '#94a3b8' : '#475569'};
          font-weight: 600;
          font-size: 13px;
          padding: 12px 14px;
          text-align: right;
          border-bottom: 2px solid ${isDark ? '#334155' : '#e2e8f0'};
        }
        td {
          padding: 11px 14px;
          text-align: right;
          border-bottom: 1px solid ${isDark ? '#1e293b' : '#f1f5f9'};
          color: ${isDark ? '#cbd5e1' : '#374151'};
          font-size: 14px;
        }
        tr:last-child td { border-bottom: none; }
        tbody tr:nth-child(even) { background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'}; }

        /* ── Buttons / CTA links ── */
        /* Wrapper divs */
        .my-12, .my-4 { margin-top: 16px; margin-bottom: 16px; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .flex-row { flex-direction: row; }
        .items-center { align-items: center; }
        .justify-center { justify-content: center; }
        .w-full { width: 100%; }
        .max-w-sm { max-width: 100%; }
        .mx-auto { margin-left: auto; margin-right: auto; }
        .gap-3 { gap: 12px; }

        /* Base anchor/button style */
        a {
          color: #2784F5;
          text-decoration: none;
        }

        /* Styled CTA buttons — any <a> with inline classes that look like buttons */
        a.group, a[class*="bg-"], a[class*="rounded"] {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px;
          width: 100% !important;
          padding: 16px 24px !important;
          border-radius: 16px !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          text-decoration: none !important;
          color: #ffffff !important;
          margin: 6px 0 !important;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        /* Color variants */
        a[class*="bg-indigo"], a[class*="bg-blue-6"], a[class*="bg-blue-7"] {
          background: #4f46e5 !important;
        }
        a[class*="bg-blue-5"] {
          background: #3b82f6 !important;
        }
        a[class*="bg-emerald"], a[class*="bg-green"] {
          background: #10b981 !important;
        }
        a[class*="bg-red"] {
          background: #ef4444 !important;
        }
        a[class*="bg-yellow"], a[class*="bg-amber"] {
          background: #f59e0b !important;
        }
        a[class*="bg-purple"] {
          background: #8b5cf6 !important;
        }
        a[class*="bg-pink"] {
          background: #ec4899 !important;
        }

        /* Hide SVG decorative icons inside buttons (they break layout in WebView) */
        a svg { display: none !important; }

        /* Hover/active state */
        a:active { opacity: 0.85; }

        /* ── Utility classes used in content ── */
        .uppercase { text-transform: uppercase; }
        .tracking-widest { letter-spacing: 0.1em; }
        .font-black { font-weight: 900; }
        .text-white { color: #ffffff !important; }
        .inline-flex { display: inline-flex; }
        .relative { position: relative; }
        .group { display: flex; }
      </style>
    </head>
    <body>
      ${htmlContent}
      <script>
        // Link interception — open in device browser
        document.addEventListener('click', function(e) {
          var target = e.target;
          while (target && target.tagName !== 'A') target = target.parentElement;
          if (target && target.href && target.href !== '#' && !target.href.startsWith('javascript')) {
            e.preventDefault();
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'link', url: target.href }));
          }
        });

        // Height reporting
        function reportHeight() {
          var h = document.body.scrollHeight;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: h }));
        }
        reportHeight();
        setTimeout(reportHeight, 100);
        setTimeout(reportHeight, 500);

        var observer = new MutationObserver(reportHeight);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'height' && msg.height) {
        const newHeight = Math.max(100, msg.height + 20);
        setWebViewHeight(newHeight);
      } else if (msg.type === 'link' && msg.url) {
        console.log('HtmlBlock: Opening link in browser:', msg.url);
        Linking.openURL(msg.url).catch(() => {});
      }
    } catch (e) {}
  };

  const shouldTruncate = isPreview;
  const displayHeight = shouldTruncate ? Math.min(webViewHeight, 150) : webViewHeight;

  const gradientColors = isDark
    ? ['rgba(15,23,42,0)', 'rgba(15,23,42,0.7)', 'rgba(15,23,42,0.95)', '#0F172A']
    : ['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,0.95)', '#FFFFFF'];

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
          setTimeout(function() {
            var h = document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: h }));
          }, 300);
          true;
        `}
      />
      {shouldTruncate && (
        <LinearGradient
          colors={gradientColors}
          style={styles.gradientOverlay}
          pointerEvents="none"
        />
      )}
    </View>
  );
}
