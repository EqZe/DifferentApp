const { withDangerousMod, withAppBuildGradle, withProjectBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const STYLES_XML_CONTENT = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="android:editTextBackground">@drawable/rn_edit_text_material</item>
    <item name="colorPrimary">@color/colorPrimary</item>
    <item name="android:statusBarColor">@android:color/transparent</item>
    <item name="android:navigationBarColor">@android:color/transparent</item>
  </style>
  <style name="Theme.App.SplashScreen" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@color/splashscreen_background</item>
    <item name="windowSplashScreenAnimatedIcon">@drawable/splashscreen_logo</item>
    <item name="postSplashScreenTheme">@style/AppTheme</item>
    <item name="android:windowSplashScreenBehavior">icon_preferred</item>
  </style>
  <style name="Theme.MaterialComponents.DayNight.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar" />
  <style name="Theme.MaterialComponents.Light.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar" />
  <style name="Theme.Material3.DayNight.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar" />
  <style name="Theme.Material3.Light.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar" />
  <style name="Theme.Material3.DynamicColors.DayNight.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar" />
  <style name="Theme.Material3.DynamicColors.Light.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar" />
  <style name="Theme.Material3Expressive.DayNight.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar" />
  <style name="Theme.Material3Expressive.Light.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar" />
  <style name="Theme.Material3Expressive.DynamicColors.DayNight.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar" />
  <style name="Theme.Material3Expressive.DynamicColors.Light.NoActionBar" parent="Theme.AppCompat.Light.NoActionBar" />
</resources>
`;

const withMaterialThemeStyles = (config) => {
  return withDangerousMod(config, [
    'android',
    (configMod) => {
      try {
        const stylesDir = path.join(
          configMod.modRequest.platformProjectRoot,
          'app', 'src', 'main', 'res', 'values'
        );
        const stylesPath = path.join(stylesDir, 'styles.xml');
        if (!fs.existsSync(stylesDir)) {
          fs.mkdirSync(stylesDir, { recursive: true });
        }
        fs.writeFileSync(stylesPath, STYLES_XML_CONTENT, 'utf8');
        console.log('✅ styles.xml written successfully');
      } catch (error) {
        console.error('❌ Error writing styles.xml:', error.message);
      }
      return configMod;
    },
  ]);
};

const withMaterialDependency = (config) => {
  return withAppBuildGradle(config, (configMod) => {
    try {
      const dependency = "implementation 'com.google.android.material:material:1.12.0'";
      if (
        configMod.modResults.language === 'groovy' &&
        !configMod.modResults.contents.includes('com.google.android.material:material')
      ) {
        configMod.modResults.contents = configMod.modResults.contents.replace(
          /dependencies\s*{/,
          `dependencies {\n    ${dependency}`
        );
        console.log('✅ Injected Material Design library dependency into app/build.gradle');
      }
    } catch (error) {
      console.error('❌ Error injecting Material dependency:', error.message);
    }
    return configMod;
  });
};

// KEY FIX: Patch the edge-to-edge library's build.gradle directly
const withEdgeToEdgeMaterialDependency = (config) => {
  return withDangerousMod(config, [
    'android',
    (configMod) => {
      try {
        const edgeToEdgeBuildGradle = path.join(
          configMod.modRequest.platformProjectRoot,
          '..',
          'node_modules',
          'react-native-edge-to-edge',
          'android',
          'build.gradle'
        );

        if (fs.existsSync(edgeToEdgeBuildGradle)) {
          let contents = fs.readFileSync(edgeToEdgeBuildGradle, 'utf8');
          const dependency = "implementation 'com.google.android.material:material:1.12.0'";

          if (!contents.includes('com.google.android.material:material')) {
            contents = contents.replace(
              /dependencies\s*{/,
              `dependencies {\n    ${dependency}`
            );
            fs.writeFileSync(edgeToEdgeBuildGradle, contents, 'utf8');
            console.log('✅ Injected Material dependency into react-native-edge-to-edge/android/build.gradle');
          } else {
            console.log('ℹ️ Material dependency already present in react-native-edge-to-edge');
          }
        } else {
          console.warn('⚠️ react-native-edge-to-edge build.gradle not found at:', edgeToEdgeBuildGradle);
        }
      } catch (error) {
        console.error('❌ Error patching edge-to-edge build.gradle:', error.message);
      }
      return configMod;
    },
  ]);
};

const withMaterialThemeFixPlugin = (config) => {
  console.log('🔧 Applying Material Theme fixes...');
  config = withMaterialThemeStyles(config);
  config = withMaterialDependency(config);
  config = withEdgeToEdgeMaterialDependency(config);
  console.log('✅ Material Theme fixes applied successfully');
  return config;
};

module.exports = createRunOncePlugin(withMaterialThemeFixPlugin, 'MaterialThemeFix', '1.0.0');