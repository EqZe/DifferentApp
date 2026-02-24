
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import "react-native-reanimated";
import { useColorScheme, Alert, I18nManager, Platform } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { UserProvider } from "@/contexts/UserContext";
import * as SplashScreen from "expo-splash-screen";
import { useNetworkState } from "expo-network";
import { StatusBar } from "expo-status-bar";
import { SystemBars } from "react-native-edge-to-edge";
import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { Colors } from "@/constants/Colors";
import Constants from "expo-constants";

// Force RTL layout for Hebrew - MUST be at the very top before any components render
// This is critical for Android to apply RTL correctly
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  
  // On Android, changing RTL requires an app restart
  if (Platform.OS === 'android') {
    console.log('🔄 RTL was not enabled. Forcing RTL and reloading app...');
    // The app will restart automatically on Android when RTL changes
  }
}

SplashScreen.preventAutoHideAsync();

const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.light.primary,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.cardBorder,
    notification: Colors.light.secondary,
  },
};

const CustomDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.dark.primary,
    background: Colors.dark.background,
    card: Colors.dark.card,
    text: Colors.dark.text,
    border: Colors.dark.cardBorder,
    notification: Colors.dark.secondary,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isConnected } = useNetworkState();

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    // Log backend URL and RTL status at app startup for debugging
    const backendUrl = Constants.expoConfig?.extra?.backendUrl;
    console.log('🚀 App starting with backend URL:', backendUrl);
    console.log('🔄 RTL enabled:', I18nManager.isRTL);
    console.log('📱 Platform:', Platform.OS);
    console.log('🌍 Writing Direction:', I18nManager.isRTL ? 'RTL' : 'LTR');
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    if (isConnected === false) {
      Alert.alert(
        "No Internet Connection",
        "Please check your internet connection and try again."
      );
    }
  }, [isConnected]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, direction: I18nManager.isRTL ? 'rtl' : 'ltr' }}>
      <ThemeProvider value={colorScheme === "dark" ? CustomDarkTheme : LightTheme}>
        <UserProvider>
          <WidgetProvider>
            <SystemBars style={colorScheme === "dark" ? "light" : "dark"} />
            <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="register" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </WidgetProvider>
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
