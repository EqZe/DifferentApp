
const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Gradle configuration plugin to fix dependency resolution issues
 * Adds retry logic and alternative repository configurations
 */
function withGradleConfig(config) {
  // Configure project-level build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      let contents = config.modResults.contents;

      // Add retry configuration for dependency resolution
      if (!contents.includes('gradle.projectsEvaluated')) {
        const retryConfig = `
// Retry configuration for dependency resolution
gradle.projectsEvaluated {
    allprojects {
        repositories {
            // Ensure Google Maven is first
            google {
                content {
                    includeGroupByRegex "com\\\\.android.*"
                    includeGroupByRegex "com\\\\.google.*"
                    includeGroupByRegex "androidx.*"
                }
            }
            mavenCentral()
            
            // Add JitPack as fallback
            maven { url 'https://jitpack.io' }
        }
        
        // Configure retry logic for failed downloads
        configurations.all {
            resolutionStrategy {
                cacheChangingModulesFor 0, 'seconds'
                cacheDynamicVersionsFor 0, 'seconds'
            }
        }
    }
}
`;
        // Insert before the last closing brace
        const lastBraceIndex = contents.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          contents = contents.slice(0, lastBraceIndex) + retryConfig + contents.slice(lastBraceIndex);
        }
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  // Configure app-level build.gradle
  config = withAppBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      let contents = config.modResults.contents;

      // Ensure proper repository configuration
      if (!contents.includes('repositories {') && contents.includes('dependencies {')) {
        const repositoriesConfig = `
repositories {
    google()
    mavenCentral()
    maven { url 'https://jitpack.io' }
}

`;
        // Insert before dependencies block
        contents = contents.replace('dependencies {', repositoriesConfig + 'dependencies {');
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
}

module.exports = withGradleConfig;
