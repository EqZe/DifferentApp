
const { withAndroidStyles, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to fix Material Theme issues on Android
 * 
 * This plugin performs two fixes:
 * 1. Replaces Theme.Material3Expressive with Theme.Material3 in styles.xml
 * 2. Injects the Material library dependency into android/app/build.gradle
 */

// Fix 1: Replace Theme.Material3Expressive with Theme.Material3 in styles.xml
const withMaterialThemeFix = (config) => {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    
    // Convert styles XML to string for manipulation
    let stylesString = JSON.stringify(styles);
    
    // Replace all occurrences of Theme.Material3Expressive with Theme.Material3
    stylesString = stylesString.replace(/Theme\.Material3Expressive/g, 'Theme.Material3');
    
    // Convert back to object
    config.modResults = JSON.parse(stylesString);
    
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
  config = withMaterialThemeFix(config);
  config = withMaterialDependency(config);
  
  console.log('✅ Material Theme fixes applied successfully');
  
  return config;
};
