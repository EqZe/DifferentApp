
const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

/**
 * Custom OneSignal configuration plugin
 * Injects OneSignal App ID into native configuration without crashing
 * This reads from app.json extra.oneSignalAppId and injects it properly
 */
const withOneSignalAppId = (config) => {
  const oneSignalAppId = config.extra?.oneSignalAppId;
  
  if (!oneSignalAppId) {
    console.warn('⚠️ OneSignal App ID not found in app.json extra.oneSignalAppId');
    return config;
  }

  console.log('✅ Configuring OneSignal with App ID:', oneSignalAppId);

  // Configure Android
  config = withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Ensure meta-data array exists
    if (!mainApplication['meta-data']) {
      mainApplication['meta-data'] = [];
    }

    // Remove existing OneSignal app ID if present
    mainApplication['meta-data'] = mainApplication['meta-data'].filter(
      (meta) => meta.$['android:name'] !== 'onesignal_app_id'
    );

    // Add OneSignal App ID as meta-data
    mainApplication['meta-data'].push({
      $: {
        'android:name': 'onesignal_app_id',
        'android:value': oneSignalAppId,
      },
    });

    console.log('✅ Android: OneSignal App ID injected into AndroidManifest.xml');
    return config;
  });

  // Configure iOS
  config = withInfoPlist(config, (config) => {
    // Add OneSignal App ID to Info.plist
    config.modResults.OneSignal_app_id = oneSignalAppId;
    
    // Ensure background modes are set for remote notifications
    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }
    if (!config.modResults.UIBackgroundModes.includes('remote-notification')) {
      config.modResults.UIBackgroundModes.push('remote-notification');
    }

    console.log('✅ iOS: OneSignal App ID injected into Info.plist');
    return config;
  });

  return config;
};

module.exports = withOneSignalAppId;
