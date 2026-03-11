
const { withProjectBuildGradle, withAppBuildGradle, withSettingsGradle } = require('@expo/config-plugins');

/**
 * Gradle configuration plugin to fix dependency resolution issues
 * Applies resolution strategy BEFORE configurations are resolved
 */
function withGradleConfig(config) {
  // Configure settings.gradle to set up repositories early
  config = withSettingsGradle(config, (config) => {
    if (config.modResults.contents) {
      let contents = config.modResults.contents;

      // Add dependency resolution management at the settings level
      if (!contents.includes('dependencyResolutionManagement')) {
        const dependencyManagement = `
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
        maven { url 'https://jitpack.io' }
    }
}

`;
        // Insert at the beginning after any existing pluginManagement block
        if (contents.includes('pluginManagement')) {
          contents = contents.replace(/pluginManagement\s*\{[^}]*\}\s*/, (match) => match + '\n' + dependencyManagement);
        } else {
          contents = dependencyManagement + contents;
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

      // Remove any existing gradle.projectsEvaluated blocks to avoid conflicts
      contents = contents.replace(/gradle\.projectsEvaluated\s*\{[\s\S]*?\n\}\s*\n/g, '');

      // Add configuration that runs BEFORE resolution
      if (!contents.includes('subprojects {')) {
        const subprojectsConfig = `
// Configure all subprojects before dependency resolution
subprojects {
    afterEvaluate { project ->
        // Only configure if not already resolved
        project.configurations.configureEach { configuration ->
            if (configuration.state == Configuration.State.UNRESOLVED) {
                configuration.resolutionStrategy {
                    // Prefer project modules
                    preferProjectModules()
                    
                    // Cache settings
                    cacheChangingModulesFor 0, 'seconds'
                    cacheDynamicVersionsFor 0, 'seconds'
                    
                    // Force consistent versions if needed
                    eachDependency { DependencyResolveDetails details ->
                        // Add any specific version forcing here if needed
                    }
                }
            }
        }
    }
}
`;
        // Insert before the last closing brace
        const lastBraceIndex = contents.lastIndexOf('}');
        if (lastBraceIndex !== -1) {
          contents = contents.slice(0, lastBraceIndex) + subprojectsConfig + contents.slice(lastBraceIndex);
        }
      }

      config.modResults.contents = contents;
    }
    return config;
  });

  return config;
}

module.exports = withGradleConfig;
