
import { useTheme } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const CALCULATOR_URL = 'https://www.1different.com/מחשבון-חיסכון/';

export default function CalculatorScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);

  console.log('CalculatorScreen (iOS): Loading savings calculator webview');

  return (
    <LinearGradient
      colors={['#2784F5', '#1a5fb8']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>מחשבון חיסכון</Text>
        </View>

        <View style={styles.webviewContainer}>
          <WebView
            source={{ uri: CALCULATOR_URL }}
            style={styles.webview}
            onLoadStart={() => {
              console.log('WebView (iOS): Started loading calculator');
              setLoading(true);
            }}
            onLoadEnd={() => {
              console.log('WebView (iOS): Finished loading calculator');
              setLoading(false);
            }}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error (iOS):', nativeEvent);
              setLoading(false);
            }}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scalesPageToFit={true}
          />

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F5AD27" />
              <Text style={styles.loadingText}>טוען מחשבון...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 100, // Space for floating tab bar
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#2784F5',
    fontWeight: '600',
  },
});
