
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useOneSignal } from '@/contexts/OneSignalContext';
import { useUser } from '@/contexts/UserContext';

/**
 * Device Diagnostics Component
 * Shows critical information about the device and app configuration
 * Helps debug issues on physical devices
 */
export function DeviceDiagnostics() {
  const { isInitialized, hasPermission, playerId } = useOneSignal();
  const { user, session } = useUser();
  const [deviceInfo, setDeviceInfo] = useState<any>({});

  useEffect(() => {
    const loadDeviceInfo = async () => {
      setDeviceInfo({
        platform: Platform.OS,
        isDevice: Device.isDevice,
        deviceName: Device.deviceName,
        modelName: Device.modelName,
        osName: Device.osName,
        osVersion: Device.osVersion,
        appVersion: Constants.expoConfig?.version,
        oneSignalAppId: Constants.expoConfig?.extra?.oneSignalAppId,
      });
    };

    loadDeviceInfo();
  }, []);

  const getStatusEmoji = (status: boolean | null | undefined) => {
    if (status === true) return '✅';
    if (status === false) return '❌';
    return '⏳';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Device Information</Text>
        <Text style={styles.item}>Platform: {deviceInfo.platform}</Text>
        <Text style={styles.item}>Is Physical Device: {deviceInfo.isDevice ? 'Yes ✅' : 'No ❌'}</Text>
        <Text style={styles.item}>Device Name: {deviceInfo.deviceName || 'Unknown'}</Text>
        <Text style={styles.item}>Model: {deviceInfo.modelName || 'Unknown'}</Text>
        <Text style={styles.item}>OS: {deviceInfo.osName} {deviceInfo.osVersion}</Text>
        <Text style={styles.item}>App Version: {deviceInfo.appVersion}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 OneSignal Status</Text>
        <Text style={styles.item}>
          {getStatusEmoji(isInitialized)} Initialized: {isInitialized ? 'Yes' : 'No'}
        </Text>
        <Text style={styles.item}>
          {getStatusEmoji(hasPermission)} Permission: {hasPermission ? 'Granted' : 'Not Granted'}
        </Text>
        <Text style={styles.item}>
          {getStatusEmoji(!!playerId)} Player ID: {playerId || 'Not Available'}
        </Text>
        <Text style={styles.item}>App ID: {deviceInfo.oneSignalAppId || 'Not Configured'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👤 User Status</Text>
        <Text style={styles.item}>
          {getStatusEmoji(!!user)} Logged In: {user ? 'Yes' : 'No'}
        </Text>
        {user && (
          <>
            <Text style={styles.item}>Name: {user.fullName}</Text>
            <Text style={styles.item}>Email: {user.email || 'Not Set'}</Text>
            <Text style={styles.item}>City: {user.city || 'Not Set'}</Text>
            <Text style={styles.item}>Has Contract: {user.hasContract ? 'Yes' : 'No'}</Text>
            <Text style={styles.item}>Auth User ID: {user.authUserId}</Text>
          </>
        )}
        <Text style={styles.item}>
          {getStatusEmoji(!!session)} Session: {session ? 'Active' : 'None'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ Important Notes</Text>
        {!Device.isDevice && (
          <Text style={styles.warning}>
            ⚠️ Running on simulator/web. OneSignal and native features will NOT work.
            Build and install on a physical device to test push notifications.
          </Text>
        )}
        {Device.isDevice && !isInitialized && (
          <Text style={styles.warning}>
            ⚠️ OneSignal not initialized. Check console logs for errors.
          </Text>
        )}
        {Device.isDevice && isInitialized && !hasPermission && (
          <Text style={styles.info}>
            ℹ️ Notification permission not granted. Go to Profile → Enable Notifications.
          </Text>
        )}
        {Device.isDevice && isInitialized && hasPermission && !playerId && (
          <Text style={styles.warning}>
            ⚠️ Player ID not available yet. This may take a few seconds after granting permission.
          </Text>
        )}
        {Device.isDevice && isInitialized && hasPermission && playerId && (
          <Text style={styles.success}>
            ✅ Everything is working! You should receive push notifications.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000',
  },
  item: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  warning: {
    fontSize: 14,
    color: '#ff9800',
    marginBottom: 8,
    fontWeight: '500',
  },
  info: {
    fontSize: 14,
    color: '#2196f3',
    marginBottom: 8,
    fontWeight: '500',
  },
  success: {
    fontSize: 14,
    color: '#4caf50',
    marginBottom: 8,
    fontWeight: '600',
  },
});
