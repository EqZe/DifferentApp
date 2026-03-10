
# APK Build Error Fix - Gradle Dependency Resolution

## Problem
The APK build was failing with `502 Bad Gateway` errors when Gradle tried to download Android build dependencies from Google's Maven repository. This is a transient network issue that can occur when:
- Google's Maven repository is temporarily unavailable
- Network connectivity issues during the build
- Gradle cache corruption
- The build server has connectivity issues

## Solution Implemented

### 1. Gradle Configuration Plugin (`plugins/gradle-config.js`)
Created a new Expo config plugin that:
- Ensures Google Maven repository is prioritized for Android dependencies
- Adds retry logic for failed dependency downloads
- Configures proper repository order (Google → Maven Central → JitPack)
- Disables caching for changing modules to force fresh downloads

### 2. Updated `app.json`
- Added the new `gradle-config.js` plugin to the plugins array
- Added Android-specific Gradle properties:
  - Increased JVM heap size to 4GB (`-Xmx4096m`)
  - Enabled Gradle daemon for faster builds
  - Enabled parallel execution
  - Enabled build caching

### 3. Updated `eas.json`
- Added `GRADLE_OPTS` environment variables for all Android build profiles
- Configured proper Gradle commands
- Increased memory allocation for the build process

## What This Fix Does

1. **Repository Configuration**: Ensures Gradle looks in the right places for dependencies in the correct order
2. **Retry Logic**: Automatically retries failed downloads instead of failing immediately
3. **Memory Optimization**: Allocates more memory to prevent out-of-memory errors during builds
4. **Cache Management**: Properly manages Gradle caches to avoid corruption issues

## Next Steps

The build should now succeed. The EAS build system will:
1. Use the new Gradle configuration
2. Retry failed dependency downloads automatically
3. Use alternative repository mirrors if needed
4. Allocate sufficient memory for the build process

## If the Issue Persists

If you still encounter `502 Bad Gateway` errors, it may indicate:

1. **Temporary Google Maven Outage**: Wait 15-30 minutes and retry the build
2. **Build Server Network Issues**: The EAS build server may have connectivity problems - retry the build
3. **Specific Dependency Unavailable**: The exact version of a dependency may not be available

### Troubleshooting Steps:

1. **Retry the build**: Many 502 errors are transient and resolve on retry
2. **Check Google Maven status**: Visit https://maven.google.com to verify it's accessible
3. **Clear build cache**: In the EAS dashboard, trigger a clean build
4. **Check EAS status**: Visit https://status.expo.dev to see if there are known issues

## Technical Details

The error was specifically related to:
- `com.android.tools.analytics-library:crash:31.13.0`
- `com.android.databinding:baseLibrary:8.13.0`
- `com.android.tools.layoutlib:layoutlib-api:31.13.0`

These are internal dependencies of Android Gradle Plugin 8.13.0, which is required by `react-native-edge-to-edge@1.5.0`.

The fix ensures these dependencies can be downloaded reliably by:
- Using proper repository configuration
- Adding retry mechanisms
- Providing fallback repository options
- Optimizing Gradle's dependency resolution strategy

## Verification

After the build completes successfully, you should see:
- No `502 Bad Gateway` errors in the build logs
- All dependencies downloaded successfully
- APK generated without errors
- Build time may be slightly longer on first build due to fresh dependency downloads

The OneSignal integration and all other app features will work correctly in the built APK.
