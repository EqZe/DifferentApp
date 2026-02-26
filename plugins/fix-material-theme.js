
const { withAndroidStyles, withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to fix Material Theme issues on Android
 * 
 * This plugin performs two fixes:
 * 1. Adds theme aliases for MaterialComponents and Material3Expressive themes
 * 2. Injects the Material library dependency into android/app/build.gradle
 */

// Helper to apply theme modifications to styles.xml content
function applyStylesMod(stylesContent) {
  // Replace Material3Expressive with standard Material3
  stylesContent = stylesContent.replace(/Theme\.Material3Expressive/g, 'Theme.Material3');

  // Add theme aliases if not present
  const aliases = [
    // MaterialComponents aliases
    { from: 'Theme.MaterialComponents.DayNight.NoActionBar', to: 'Theme.Material3.DayNight.NoActionBar' },
    { from: 'Theme.MaterialComponents.Light.NoActionBar', to: 'Theme.Material3.Light.NoActionBar' },
    // Material3 aliases (for cases where react-native-edge-to-edge might look for them directly)
    { from: 'Theme.Material3.DayNight.NoActionBar', to: 'Theme.Material3.DayNight.NoActionBar' },
    { from: 'Theme.Material3.Light.NoActionBar', to: 'Theme.Material3.Light.NoActionBar' },
    { from: 'Theme.Material3.DynamicColors.DayNight.NoActionBar', to: 'Theme.Material3.DynamicColors.DayNight.NoActionBar' },
    { from: 'Theme.Material3.DynamicColors.Light.NoActionBar', to: 'Theme.Material3.DynamicColors.Light.NoActionBar' },
    // Material3Expressive aliases (mapping to standard Material3)
    { from: 'Theme.Material3Expressive.DayNight.NoActionBar', to: 'Theme.Material3.DayNight.NoActionBar' },
    { from: 'Theme.Material3Expressive.DynamicColors.DayNight.NoActionBar', to: 'Theme.Material3.DynamicColors.DayNight.NoActionBar' },
    { from: 'Theme.Material3Expressive.DynamicColors.Light.NoActionBar', to: 'Theme.Material3.DynamicColors.Light.NoActionBar' },
    { from: 'Theme.Material3Expressive.Light.NoActionBar', to: 'Theme.Material3.Light.NoActionBar' },
  ];

  aliases.forEach(({ from, to }) => {
    const aliasTag = `<style name="${from}" parent="${to}" />`;
    if (!stylesContent.includes(aliasTag)) {
      // Find the closing </resources> tag and insert before it
      stylesContent = stylesContent.replace('</resources>', `  ${aliasTag}\n</resources>`);
    }
  });

  return stylesContent;
}

// Fix 1: Add theme aliases to styles.xml
const withMaterialThemeStyles = (config) => {
  return withAndroidStyles(config, (configMod) => {
    // Use configMod.modResults.contents directly - this is the correct way
    let stylesContent = configMod.modResults.contents;
    
    console.log('📝 Applying Material Theme fixes to styles.xml');
    stylesContent = applyStylesMod(stylesContent);
    configMod.modResults.contents = stylesContent; // Update the content
    return configMod;
  });
};

// Fix 2: Inject Material library dependency into android/app/build.gradle
const withMaterialDependency = (config) => {
  return withAppBuildGradle(config, (configMod) => {
    if (configMod.modResults.language === 'groovy') {
      const dependency = "implementation 'com.google.android.material:material:1.12.0'";
      if (!configMod.modResults.contents.includes(dependency)) {
        configMod.modResults.contents = configMod.modResults.contents.replace(
          /dependencies\s*{/,
          `dependencies {\n    ${dependency}`
        );
        console.log('✅ Injected Material Design library dependency into app/build.gradle');
      } else {
        console.log('ℹ️ Material Design library dependency already exists in app/build.gradle');
      }
    } else {
      console.warn('Skipping Material dependency injection: app/build.gradle is not Groovy.');
    }
    return configMod;
  });
};

// Main plugin combining all fixes
const withMaterialThemeFixPlugin = (config) => {
  console.log('🔧 Applying Material Theme fixes...');
  config = withMaterialThemeStyles(config);
  config = withMaterialDependency(config);
  console.log('✅ Material Theme fixes applied successfully');
  return config;
};

module.exports = createRunOncePlugin(withMaterialThemeFixPlugin, 'MaterialThemeFix', '1.0.0');
