
const { withAndroidStyles, withAppBuildGradle, AndroidConfig } = require('@expo/config-plugins');
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
    const stylesPath = config.modResults.path;
    console.log(`📝 Modifying styles.xml at: ${stylesPath}`);
    
    // Read the current styles.xml content
    let stylesContent = fs.readFileSync(stylesPath, 'utf-8');
    
    // Define the theme aliases we need to add
    const aliases = `
    <!-- MaterialComponents theme aliases -->
    <style name="Theme.MaterialComponents.DayNight.NoActionBar" parent="Theme.Material3.DayNight.NoActionBar" />
    <style name="Theme.MaterialComponents.Light.NoActionBar" parent="Theme.Material3.Light.NoActionBar" />
    
    <!-- Material3Expressive theme aliases -->
    <style name="Theme.Material3Expressive.DayNight.NoActionBar" parent="Theme.Material3.DayNight.NoActionBar" />
    <style name="Theme.Material3Expressive.DynamicColors.DayNight.NoActionBar" parent="Theme.Material3.DynamicColors.DayNight.NoActionBar" />
    <style name="Theme.Material3Expressive.DynamicColors.Light.NoActionBar" parent="Theme.Material3.DynamicColors.Light.NoActionBar" />
    <style name="Theme.Material3Expressive.Light.NoActionBar" parent="Theme.Material3.Light.NoActionBar" />
`;
    
    // Check if aliases already exist
    if (stylesContent.includes('Theme.MaterialComponents.DayNight.NoActionBar')) {
      console.log('⏭️  Theme aliases already exist in styles.xml');
      return config;
    }
    
    // Update AppTheme to use Material3
    stylesContent = stylesContent.replace(
      /<style name="AppTheme" parent="[^"]*">/,
      '<style name="AppTheme" parent="Theme.Material3.DayNight.NoActionBar">'
    );
    
    // Insert aliases before the closing </resources> tag
    stylesContent = stylesContent.replace(
      '</resources>',
      `${aliases}\n</resources>`
    );
    
    // Write the modified content back
    fs.writeFileSync(stylesPath, stylesContent, 'utf-8');
    console.log('✅ Added theme aliases to styles.xml');
    
    return config;
  });
};

// Fix 2: Inject Material library dependency into android/app/build.gradle
const withMaterialDependency = (config) => {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;
    
    // Check if the dependency is already present
    if (buildGradle.includes("implementation 'com.google.android.material:material:")) {
      console.log('✅ Material library dependency already present in build.gradle');
      return config;
    }
    
    // Find the dependencies block and add the Material library
    const dependenciesRegex = /dependencies\s*\{/;
    const match = buildGradle.match(dependenciesRegex);
    
    if (match) {
      const insertPosition = match.index + match[0].length;
      
      // Insert the Material library dependency
      buildGradle = 
        buildGradle.slice(0, insertPosition) +
        "\n    implementation 'com.google.android.material:material:1.12.0'" +
        buildGradle.slice(insertPosition);
      
      config.modResults.contents = buildGradle;
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
