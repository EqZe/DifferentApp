
import React, { useState } from 'react';
import { View, useColorScheme, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

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

export function HtmlBlock({ data, isLocked = false, isPreview = false }: HtmlBlockProps) {
  const [webViewHeight, setWebViewHeight] = useState(300);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const rawContent = data?.content ?? data?.html ?? data?.body ?? data?.text ?? '';
  const htmlContent = rawContent.replace(/`/g, '&#96;');

  const textColor = isDark ? '#E2E8F0' : '#1a1a1a';
  const bgColor = isDark ? '#0F172A' : '#FFFFFF';

  const htmlTemplate = `<!DOCTYPE html>
<html dir="rtl">
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      background-color: ${bgColor};
      color: ${textColor};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 16px;
      line-height: 1.6;
      direction: rtl;
      padding: 0 4px;
    }
    h1, h2, h3, h4, h5, h6 { color: #2784F5; margin: 12px 0 8px 0; }
    p { margin: 8px 0; }
    a { color: #2784F5; }

    /* Tables */
    .table-wrapper { overflow-x: auto; margin: 16px 0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.15); }
    table { width: 100%; border-collapse: collapse; background: #fff; font-size: 14px; }
    thead { background-color: #312e81; color: #fff; }
    th { padding: 12px 16px; border: 1px solid #3730a3; text-align: right; font-size: 16px; color: #fff; }
    td { padding: 12px 16px; border: 1px solid #e5e7eb; text-align: right; color: #1a1a1a; }
    tbody tr:nth-child(even) { background-color: #f9fafb; }
    tbody tr:nth-child(odd) { background-color: #ffffff; }

    /* Tailwind utility classes */
    .w-full { width: 100%; }
    .text-right { text-align: right; }
    .border-collapse { border-collapse: collapse; }
    .bg-white { background-color: #ffffff; }
    .text-sm { font-size: 14px; }
    .text-lg { font-size: 18px; }
    .bg-indigo-900 { background-color: #312e81 !important; }
    .text-white { color: #ffffff !important; }
    .p-3 { padding: 12px; }
    .p-4 { padding: 16px; }
    .border { border: 1px solid #e5e7eb; }
    .border-gray-200 { border-color: #e5e7eb; }
    .border-indigo-800 { border-color: #3730a3; }
    .font-bold { font-weight: bold; }
    .text-indigo-900 { color: #312e81; }
    .shadow-lg { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    .rounded-xl { border-radius: 12px; }
    .overflow-hidden { overflow: hidden; }
    .my-8 { margin-top: 32px; margin-bottom: 32px; }
    .my-12 { margin-top: 48px; margin-bottom: 48px; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .gap-3 { gap: 12px; }
    .gap-4 { gap: 16px; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .text-center { text-align: center; }
    .font-semibold { font-weight: 600; }
    .text-base { font-size: 16px; }
    .px-6 { padding-left: 24px; padding-right: 24px; }
    .py-3 { padding-top: 12px; padding-bottom: 12px; }
    .rounded-full { border-radius: 9999px; }
    .bg-blue-600 { background-color: #2563eb; }
    .bg-green-600 { background-color: #16a34a; }
    .block { display: block; }
    .inline-block { display: inline-block; }

    /* Links styled as buttons */
    a[class*="bg-"] {
      display: block;
      padding: 12px 24px;
      border-radius: 9999px;
      text-align: center;
      text-decoration: none;
      font-weight: 600;
      color: #ffffff !important;
      margin: 8px 0;
    }
  </style>
</head>
<body>
${htmlContent}
<script>
  // Height reporting
  function reportHeight() {
    var h = document.documentElement.scrollHeight || document.body.scrollHeight;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: h }));
  }
  reportHeight();
  setTimeout(reportHeight, 100);
  setTimeout(reportHeight, 500);
  setTimeout(reportHeight, 1000);

  // Link interception
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') { el = el.parentElement; }
    if (el && el.href) {
      e.preventDefault();
      console.log('HtmlBlock: link tapped:', el.href);
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'link', url: el.href }));
    }
  });
</script>
</body>
</html>`;

  const handleMessage = (event: any) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'height' && msg.height > 0) {
        const newHeight = Math.max(100, msg.height + 32);
        setWebViewHeight(newHeight);
      } else if (msg.type === 'link' && msg.url) {
        console.log('HtmlBlock: opening link in browser:', msg.url);
        Linking.openURL(msg.url).catch(() => {});
      }
    } catch {}
  };

  const shouldTruncate = isPreview;
  const displayHeight = shouldTruncate ? Math.min(webViewHeight, 150) : webViewHeight;

  return (
    <View style={{ width: '100%', height: displayHeight }}>
      <WebView
        source={{ html: htmlTemplate }}
        style={{ flex: 1, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        scalesPageToFit={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        onMessage={handleMessage}
        injectedJavaScript={`
          setTimeout(function() {
            var h = document.documentElement.scrollHeight || document.body.scrollHeight;
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', height: h }));
          }, 800);
          true;
        `}
      />
    </View>
  );
}
