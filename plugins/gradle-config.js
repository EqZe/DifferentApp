
const { withProjectBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

/**
 * Gradle configuration plugin to fix dependency resolution issues
 * Applies resolution strategy BEFORE dependencies are resolved
 */
function withGradleConfig(config) {
  // Configure settings.gradle to add repositories at the earliest stage
  config = withSettingsGradle(config, (config) => {
    if (config.modResults.contents) {
      let contents = config.modResults.contents;

      // Ensure repositories are configured in dependencyResolutionManagement
      if (!contents.includes('// Custom repository configuration')) {
        const repositoryConfig = `
// Custom repository configuration for dependency resolution
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_SETTINGS)
    repositories {
        google {
            content {
                includeGroupByRegex "com\\\\.android.*"
                includeGroupByRegex "com\\\\.google.*"
                includeGroupByRegex "androidx.*"
            }
        }
        mavenCentral()
        maven { url = uri("https://jitpack.io") }
    }
}
`;
        // Replace existing dependencyResolutionManagement if present
        if (contents.includes('dependencyResolutionManagement')) {
          contents = contents.replace(
            /dependencyResolutionManagement\s*\{[^}]*\}/s,
            repositoryConfig.trim()
          );
        } else {
          // Add before pluginManagement or at the beginning
          if (contents.includes('pluginManagement')) {
            contents = contents.replace('pluginManagement', repositoryConfig + '\npluginManagement');
          } else {
            contents = repositoryConfig + '\n' + contents;
          }
        }
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  // Configure project-level build.gradle
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents) {
      let contents = config.modResults.contents;

      // Add resolution strategy in allprojects block BEFORE projectsEvaluated
      // This ensures it's applied early enough
      if (!contents.includes('// Early resolution strategy configuration')) {
        const earlyResolutionConfig = `
// Early resolution strategy configuration
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}

// Configure resolution strategy before dependencies are resolved
subprojects {
    afterEvaluate { project ->
        project.configurations.configureEach { configuration ->
            // Only configure if not already resolved
            if (configuration.state == Configuration.State.UNRESOLVED) {
                configuration.resolutionStrategy {
                    // Cache dynamic versions for 0 seconds to always get latest
                    cacheDynamicVersionsFor 0, 'seconds'
                    // Cache changing modules for 0 seconds
                    cacheChangingModulesFor 0, 'seconds'
                }
            }
        }
    }
}
`;
        // Insert after buildscript block but before any other configuration
        if (contents.includes('allprojects {')) {
          // Replace existing allprojects block
          contents = contents.replace(
            /allprojects\s*\{[^}]*\}/s,
            earlyResolutionConfig.trim()
          );
        } else {
          // Insert after buildscript
          const buildscriptEnd = contents.indexOf('}', contents.indexOf('buildscript'));
          if (buildscriptEnd !== -1) {
            contents = contents.slice(0, buildscriptEnd + 1) + '\n' + earlyResolutionConfig + contents.slice(buildscriptEnd + 1);
          } else {
            // Insert at the beginning if no buildscript found
            contents = earlyResolutionConfig + '\n' + contents;
          }
        }
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
}

module.exports = withGradleConfig;
