
const { withAndroidStyles, withAppBuildGradle } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo Config Plugin to fix Material Theme issues on Android
 * 
 * This plugin performs two fixes:
 * 1. Adds theme aliases for MaterialComponents and Material3Expressive themes
 * 2. Injects the Material library dependency into android/app/build.gradle
 */

// Fix 1: Add theme aliases to styles.xml
const withMaterialThemeAliases = (config) => {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    
    // Define the theme aliases we need to add
    const aliasesToAdd = [
      // MaterialComponents aliases
      { name: 'Theme.MaterialComponents.DayNight.NoActionBar', parent: 'Theme.Material3.DayNight.NoActionBar' },
      { name: 'Theme.MaterialComponents.Light.NoActionBar', parent: 'Theme.Material3.Light.NoActionBar' },
      // Material3Expressive aliases
      { name: 'Theme.Material3Expressive.DayNight.NoActionBar', parent: 'Theme.Material3.DayNight.NoActionBar' },
      { name: 'Theme.Material3Expressive.DynamicColors.DayNight.NoActionBar', parent: 'Theme.Material3.DynamicColors.DayNight.NoActionBar' },
      { name: 'Theme.Material3Expressive.DynamicColors.Light.NoActionBar', parent: 'Theme.Material3.DynamicColors.Light.NoActionBar' },
      { name: 'Theme.Material3Expressive.Light.NoActionBar', parent: 'Theme.Material3.Light.NoActionBar' },
    ];
    
    // Ensure resources object exists
    if (!styles.resources) {
      styles.resources = {};
    }
    
    // Ensure style array exists
    if (!styles.resources.style) {
      styles.resources.style = [];
    }
    
    // Convert to array if it's not already
    if (!Array.isArray(styles.resources.style)) {
      styles.resources.style = [styles.resources.style];
    }
    
    // Get existing style names to avoid duplicates
    const existingStyleNames = styles.resources.style
      .filter(style => style && style.$)
      .map(style => style.$.name);
    
    // Add each alias if it doesn't already exist
    aliasesToAdd.forEach(alias => {
      if (!existingStyleNames.includes(alias.name)) {
        styles.resources.style.push({
          $: {
            name: alias.name,
            parent: alias.parent
          }
        });
        console.log(`✅ Added theme alias: ${alias.name} -> ${alias.parent}`);
      } else {
        console.log(`⏭️  Theme alias already exists: ${alias.name}`);
      }
    });
    
    config.modResults = styles;
    return config;
  });
};

// Fix 2: Inject Material library dependency into android/app/build.gradle
const withMaterialDependency = (config) => {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;
    
    // Check if the dependency is already present
    if (buildGradle.includes("implementation 'com.google.android.material:material:1.12.0'")) {
      console.log('✅ Material library dependency already present in build.gradle');
      return config;
    }
    
    // Find the dependencies block
    const dependenciesRegex = /dependencies\s*\{/;
    const match = buildGradle.match(dependenciesRegex);
    
    if (match) {
      const insertPosition = match.index + match[0].length;
      
      // Insert the Material library dependency at the beginning of the dependencies block
      const newContent = 
        buildGradle.slice(0, insertPosition) +
        "\n    implementation 'com.google.android.material:material:1.12.0'" +
        buildGradle.slice(insertPosition);
      
      config.modResults.contents = newContent;
      console.log('✅ Injected Material library dependency into build.gradle');
    } else {
      console.warn('⚠️ Could not find dependencies block in build.gradle');
    }
    
    return config;
  });
};

// Export the combined plugin
module.exports = (config) => {
  console.log('🔧 Applying Material Theme fixes...');
  
  // Apply both fixes
  config = withMaterialThemeAliases(config);
  config = withMaterialDependency(config);
  
  console.log('✅ Material Theme fixes applied successfully');
  
  return config;
};
