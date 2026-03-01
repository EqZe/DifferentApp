const { withDangerousMod, withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const ONESIGNAL_APP_ID = "b732b467-6886-4c7b-b3d9-5010de1199d6";

// FULL STYLES FOR THE MAIN APP
const APP_STYLES_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar">
    <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    <item name="colorPrimary">#000000</item>
  </style>

  <style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">#000000</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splashscreen_logo</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
  </style>

  <style name="Theme.Material3Expressive.DayNight.NoActionBar" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.Material3Expressive.Light.NoActionBar" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.Material3Expressive.DynamicColors.DayNight.NoActionBar" parent="Theme.Material3.DynamicColors.DayNight.NoActionBar" />
  <style name="Theme.Material3Expressive.DynamicColors.Light.NoActionBar" parent="Theme.Material3.DynamicColors.Light.NoActionBar" />

  <style name="Theme.EdgeToEdge.DayNight.Common" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Light.Common" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3.DayNight.Common" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3.Light.Common" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3.Dynamic.DayNight.Common" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3.Dynamic.Light.Common" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3Expressive.DayNight.Common" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3Expressive.Light.Common" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3Expressive.Dynamic.DayNight.Common" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3Expressive.Dynamic.Light.Common" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material2.DayNight.Common" parent="Theme.MaterialComponents.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material2.Light.Common" parent="Theme.MaterialComponents.Light.NoActionBar" />
</resources>`;

// MINIMAL STYLES FOR THE LIBRARY (Removes Splash Screen entirely to avoid attribute errors)
const LIB_STYLES_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.Material3Expressive.DayNight.NoActionBar" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.Material3Expressive.Light.NoActionBar" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.EdgeToEdge.DayNight.Common" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Light.Common" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3.DayNight.Common" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3.Light.Common" parent="Theme.Material3.Light.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3Expressive.DayNight.Common" parent="Theme.Material3.DayNight.NoActionBar" />
  <style name="Theme.EdgeToEdge.Material3Expressive.Light.Common" parent="Theme.Material3.Light.NoActionBar" />
</resources>`;

const withOneSignalManualFix = (config) => {
  return withAppBuildGradle(config, (configMod) => {
    if (configMod.modResults.language === 'groovy') {
      let contents = configMod.modResults.contents;
      if (!contents.includes('onesignal_app_id')) {
        contents = contents.replace(/defaultConfig\s*{/, `defaultConfig {\n        manifestPlaceholders = [onesignal_app_id: "${ONESIGNAL_APP_ID}", onesignal_google_project_number: "REMOTE"]`);
        configMod.modResults.contents = contents;
      }
    }
    return configMod;
  });
};

const withNativeFixes = (config) => {
  return withDangerousMod(config, ['android', (configMod) => {
      const projectRoot = configMod.modRequest.projectRoot;
      const resValues = path.join(configMod.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'values');
      if (!fs.existsSync(resValues)) fs.mkdirSync(resValues, { recursive: true });
      fs.writeFileSync(path.join(resValues, 'styles.xml'), APP_STYLES_XML, 'utf8');

      const libRes = path.join(projectRoot, 'node_modules/react-native-edge-to-edge/android/src/main/res/values');
      if (!fs.existsSync(libRes)) fs.mkdirSync(libRes, { recursive: true });
      fs.writeFileSync(path.join(libRes, 'styles.xml'), LIB_STYLES_XML, 'utf8');

      const libGradle = path.join(projectRoot, 'node_modules/react-native-edge-to-edge/android/build.gradle');
      if (fs.existsSync(libGradle)) {
        let contents = fs.readFileSync(libGradle, 'utf8');
        contents = contents.replace(/\n?.*com\.google\.android\.material:material.*\n?/g, '\n');
        contents += `\ndependencies {\n    implementation 'com.google.android.material:material:1.13.0-beta01'\n}\n`;
        fs.writeFileSync(libGradle, contents, 'utf8');
      }
      return configMod;
    },
  ]);
};

module.exports = createRunOncePlugin((config) => {
  config = withOneSignalManualFix(config);
  config = withNativeFixes(config);
  return config;
}, 'MaterialThemeFix', '12.0.0');