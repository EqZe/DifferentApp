
const { withAndroidStyles, withAppBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to fix Material Theme issues on Android
 * 
 * This plugin performs two fixes:
 * 1. Adds theme aliases for MaterialComponents and Material3Expressive themes
 * 2. Injects the Material library dependency into android/app/build.gradle
 */

// Default styles.xml content if file doesn't exist
const DEFAULT_STYLES_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar" />
</resources>`;

// Helper to apply theme modifications to styles.xml content
function applyStylesMod(stylesContent) {
  // Ensure stylesContent is a valid string - this is the critical fix
  if (!stylesContent || typeof stylesContent !== 'string' || stylesContent.trim() === '') {
    console.log('⚠️ styles.xml content is empty or undefined, using default structure');
    return DEFAULT_STYLES_XML;
  }

  let content = stylesContent;

  // Ensure XML declaration is present and clean
  if (!content.startsWith('<?xml')) {
    content = `<?xml version="1.0" encoding="utf-8"?>\n${content}`;
  }

  // Remove unused xmlns:tools attribute that can confuse the merger
  content = content.replace(/xmlns:tools="[^"]*"/g, '');

  // Replace Material3Expressive with standard Material3
  content = content.replace(/Theme\.Material3Expressive/g, 'Theme.Material3');

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
    if (!content.includes(aliasTag)) {
      // Find the closing </resources> tag and insert before it
      if (content.includes('</resources>')) {
        content = content.replace('</resources>', `  ${aliasTag}\n</resources>`);
      } else {
        console.warn(`⚠️ Could not find </resources> tag in styles.xml, appending alias`);
        content += `\n  ${aliasTag}`;
      }
    }
  });

  return content;
}

// Fix 1: Add theme aliases to styles.xml
const withMaterialThemeStyles = (config) => {
  return withAndroidStyles(config, (configMod) => {
    try {
      // Check if modResults exists and has contents
      if (!configMod.modResults) {
        console.warn('⚠️ modResults is undefined, initializing with default structure');
        configMod.modResults = {
          contents: DEFAULT_STYLES_XML,
          path: ''
        };
        return configMod;
      }

      // Get the current content, defaulting to DEFAULT_STYLES_XML if undefined or empty
      let stylesContent = configMod.modResults.contents;
      
      // CRITICAL FIX: Ensure stylesContent is a string before passing to applyStylesMod
      if (!stylesContent || typeof stylesContent !== 'string') {
        console.warn('⚠️ styles.xml content is not a valid string, using default');
        stylesContent = DEFAULT_STYLES_XML;
      }
      
      console.log('📝 Applying Material Theme fixes to styles.xml');
      
      // Apply modifications
      const modifiedContent = applyStylesMod(stylesContent);
      
      // Update the content
      configMod.modResults.contents = modifiedContent;
      
      return configMod;
    } catch (error) {
      console.error('❌ Error applying Material Theme styles:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Ensure we return valid content even on error
      if (!configMod.modResults) {
        configMod.modResults = {
          contents: DEFAULT_STYLES_XML,
          path: ''
        };
      } else if (!configMod.modResults.contents || typeof configMod.modResults.contents !== 'string') {
        configMod.modResults.contents = DEFAULT_STYLES_XML;
      }
      
      return configMod;
    }
  });
};

// Fix 2: Inject Material library dependency into android/app/build.gradle
const withMaterialDependency = (config) => {
  return withAppBuildGradle(config, (configMod) => {
    try {
      // Check if modResults exists
      if (!configMod.modResults || !configMod.modResults.contents) {
        console.warn('⚠️ build.gradle modResults is undefined, skipping Material dependency injection');
        return configMod;
      }

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
    } catch (error) {
      console.error('❌ Error injecting Material dependency:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return configMod;
  });
};

// Main plugin combining all fixes
const withMaterialThemeFixPlugin = (config) => {
  console.log('🔧 Applying Material Theme fixes...');
  
  try {
    config = withMaterialThemeStyles(config);
    config = withMaterialDependency(config);
    console.log('✅ Material Theme fixes applied successfully');
  } catch (error) {
    console.error('❌ Error in Material Theme Fix Plugin:', error.message);
    console.error('Stack trace:', error.stack);
  }
  
  return config;
};

module.exports = createRunOncePlugin(withMaterialThemeFixPlugin, 'MaterialThemeFix', '1.0.0');
