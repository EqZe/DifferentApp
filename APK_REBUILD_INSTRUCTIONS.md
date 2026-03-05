
# 🔧 APK Rebuild Instructions - OneSignal Fix

## What Was Fixed

The `app.json` file was missing the critical `appId` property in the OneSignal plugin configuration. This has now been added:

```json
{
  "expo": {
    "plugins": [
      [
        "onesignal-expo-plugin",
        {
          "mode": "production",
          "appId": "b732b467-6886-4c7b-b3d9-5010de1199d6"  // ← ADDED THIS
        }
      ]
    ]
  }
}
```

## Why You Need to Rebuild

The OneSignal `appId` is **embedded into the native Android/iOS code** during the build process. Your current APK was built without this configuration, which is why OneSignal shows `initialized: no`.

## How to Rebuild (Choose One Method)

### Method 1: EAS Build (Easiest)
Use the EAS Build button in the Natively toolbar to create a new APK with the updated configuration.

### Method 2: Manual EAS Build
If you have EAS CLI access, run:
```bash
eas build --platform android --profile preview
```

## After Rebuilding

1. **Uninstall** the old APK from your Android device
2. **Install** the new APK
3. **Open the app** and go to Profile screen
4. **Check the debug section** - you should see:
   - ✅ Initialized: Yes
   - Player ID: (will appear after granting permission)
5. **Tap "הפעל התראות Push"** to grant permission
6. **Test** by sending a notification from OneSignal dashboard

## Expected Result

After rebuilding and installing the new APK:

```
Platform: android
Initialized: ✅ Yes
Permission: ✅ Granted (after tapping the button)
Player ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
User ID: (your user ID)
```

## Verification

The Profile screen now shows clear error messages if OneSignal is not initialized, explaining that you need to rebuild the APK.

---

**Next Step:** Rebuild the APK using the EAS Build button in the toolbar.
