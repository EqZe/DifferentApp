
const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Custom OneSignal configuration plugin
 * Reads appId from app.json extra field instead of plugin config
 */
const withOneSignalAppId = (config) => {
  const oneSignalAppId = config.extra?.oneSignalAppId;
  
  if (!oneSignalAppId) {
    console.warn('⚠️ OneSignal App ID not found in app.json extra field');
    return config;
  }

  console.log('✅ OneSignal App ID configured:', oneSignalAppId);

  // Add OneSignal App ID to Android build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('onesignal_app_id')) {
      return config;
    }

    // Add OneSignal App ID as a build config field
    config.modResults.contents = config.modResults.contents.replace(
      /defaultConfig\s*{/,
      `defaultConfig {
        manifestPlaceholders = [onesignal_app_id: "${oneSignalAppId}"]
        buildConfigField "String", "ONESIGNAL_APP_ID", "\\"${oneSignalAppId}\\""`
    );

    return config;
  });

  return config;
};

module.exports = withOneSignalAppId;
