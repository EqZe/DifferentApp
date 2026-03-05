
# OneSignal Initialization Fix - Complete Guide

## Problem
OneSignal was not initializing properly because the App ID was not being injected into the native build configuration correctly. Adding `appId` directly to the `onesignal-expo-plugin` configuration in `app.json` was causing the app to crash.

## Solution
We've implemented a **custom Expo config plugin** that safely injects the OneSignal App ID into the native configuration without causing crashes.

## How It Works

### 1. App ID Storage
The OneSignal App ID is stored in `app.json` under `extra.oneSignalAppId`:

```json
{
  "expo": {
    "extra": {
      "oneSignalAppId": "b732b467-6886-4c7b-b3d9-5010de1199d6"
    }
  }
}
```

### 2. Custom Plugin (`plugins/onesignal-config.js`)
This plugin reads the App ID from `app.json` and injects it into:
- **Android**: `AndroidManifest.xml` as `<meta-data android:name="onesignal_app_id" />`
- **iOS**: `Info.plist` as `OneSignal_app_id`

### 3. Runtime Initialization (`contexts/OneSignalContext.tsx`)
The OneSignal SDK is initialized at runtime using:
```typescript
const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;
OneSignal.initialize(oneSignalAppId);
```

## Configuration

### app.json
```json
{
  "expo": {
    "plugins": [
      [
        "onesignal-expo-plugin",
        {
          "mode": "production"
        }
      ],
      "./plugins/onesignal-config.js"
    ],
    "extra": {
      "oneSignalAppId": "b732b467-6886-4c7b-b3d9-5010de1199d6"
    }
  }
}
```

**IMPORTANT**: 
- ❌ Do NOT add `appId` to the `onesignal-expo-plugin` configuration
- ✅ DO add it to `extra.oneSignalAppId`
- ✅ DO include the custom plugin `./plugins/onesignal-config.js`

## Building the App

### For Development (Expo Go)
⚠️ **OneSignal does NOT work in Expo Go**. You must build a development build or production APK/IPA.

### For Production Build

#### Android APK
```bash
eas build --platform android --profile production
```

#### iOS IPA
```bash
eas build --platform ios --profile production
```

### After Building
1. The custom plugin will inject the App ID during the prebuild phase
2. The native OneSignal SDK will be properly configured
3. The app will initialize OneSignal on launch

## Verification

### Check Logs
After launching the app, check the console for these logs:

```
🔔 OneSignal: ========================================
🔔 OneSignal: STARTING INITIALIZATION
🔔 OneSignal: ========================================
🔔 OneSignal: Platform: android
🔔 OneSignal: Is Device: true
🔔 OneSignal: App ID: b732b467-6886-4c7b-b3d9-5010de1199d6
🔔 OneSignal: Step 1 - Calling OneSignal.initialize()
🔔 OneSignal: Step 2 - Setting log level to verbose
🔔 OneSignal: Step 3 - Waiting for SDK to initialize...
🔔 OneSignal: Step 4 - Checking permission status
🔔 OneSignal: Permission status: false
🔔 OneSignal: Step 5 - Getting Player ID
🔔 OneSignal: Player ID: Not available yet
🔔 OneSignal: ========================================
🔔 OneSignal: INITIALIZATION COMPLETE
🔔 OneSignal: ========================================
🔔 OneSignal: Initialized: true
🔔 OneSignal: Permission: false
🔔 OneSignal: Player ID: Not available
🔔 OneSignal: ========================================
```

### Check Profile Screen
Go to the Profile screen to see the OneSignal debug info:
- **Platform**: Should show "android" or "ios"
- **Initialized**: Should show "✅ Yes"
- **Permission**: Shows "✅ Granted" or "❌ Not granted"
- **Player ID**: Shows the device token or "⚠️ Not available yet"

## Troubleshooting

### Issue: "initialized: no"
**Cause**: The APK was built without the proper OneSignal configuration.

**Solution**: 
1. Verify `app.json` has `oneSignalAppId` in the `extra` field
2. Verify the custom plugin is in the `plugins` array
3. **Rebuild the APK/IPA** - this is mandatory!

### Issue: "permission: not granted"
**Cause**: User hasn't granted notification permission yet.

**Solution**: 
1. Go to Profile screen
2. Tap "הפעל התראות" (Enable Notifications)
3. Grant permission when prompted

### Issue: "player id: not available"
**Cause**: Player ID only appears after permission is granted.

**Solution**: 
1. Grant notification permission first
2. Wait a few seconds
3. Player ID will appear automatically

### Issue: App crashes on launch
**Cause**: Incorrect plugin configuration or App ID.

**Solution**:
1. Remove `appId` from `onesignal-expo-plugin` config if present
2. Ensure `oneSignalAppId` is in `extra` field
3. Rebuild the app

## Testing Push Notifications

### Via OneSignal Dashboard
1. Go to OneSignal dashboard
2. Navigate to Messages → New Push
3. Select "Send to Test Device"
4. Enter the Player ID from the Profile screen
5. Send the notification

### Via Supabase Edge Functions
The app has automatic push notifications for:
- Task status changes (PENDING → DONE)
- Container updates
- Schedule changes

These are triggered automatically by database changes.

## Key Points

✅ **DO**:
- Store App ID in `app.json` `extra.oneSignalAppId`
- Use the custom plugin `./plugins/onesignal-config.js`
- Rebuild APK/IPA after configuration changes
- Test on real devices (not Expo Go)

❌ **DON'T**:
- Add `appId` to `onesignal-expo-plugin` configuration
- Test in Expo Go (OneSignal requires native build)
- Expect Player ID before permission is granted
- Skip rebuilding after configuration changes

## Files Modified

1. **app.json** - Configuration with App ID in `extra` field
2. **plugins/onesignal-config.js** - Custom plugin to inject App ID
3. **contexts/OneSignalContext.tsx** - Runtime initialization with detailed logging

## Support

If you continue to have issues:
1. Check the console logs for detailed error messages
2. Verify the App ID is correct in OneSignal dashboard
3. Ensure you've rebuilt the APK/IPA after configuration changes
4. Check that all required permissions are in `app.json`
