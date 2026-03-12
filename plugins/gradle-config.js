const { withProjectBuildGradle } = require('@expo/config-plugins');

function withGradleConfig(config) {
  config = withProjectBuildGradle(config, (config) => {
    let contents = config.modResults.contents;

    // Remove any existing gradle.projectsEvaluated blocks to avoid conflicts
    contents = contents.replace(/gradle\.projectsEvaluated\s*\{[\s\S]*?\n\}\s*\n/g, '');

    // Add subprojects resolution strategy if not already present
    if (!contents.includes('subprojects {')) {
      const subprojectsConfig = [
        '',
        '// Configure all subprojects before dependency resolution',
        'subprojects {',
        '    afterEvaluate { project ->',
        '        project.configurations.configureEach { configuration ->',
        '            if (configuration.state == Configuration.State.UNRESOLVED) {',
        '                configuration.resolutionStrategy {',
        '                    preferProjectModules()',
        '                    cacheChangingModulesFor 0, "seconds"',
        '                    cacheDynamicVersionsFor 0, "seconds"',
        '                }',
        '            }',
        '        }',
        '    }',
        '}',
        '',
      ].join('\n');

      const lastBraceIndex = contents.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        contents = contents.slice(0, lastBraceIndex) + subprojectsConfig + contents.slice(lastBraceIndex);
      }
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = withGradleConfig;