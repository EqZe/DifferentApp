
# Physical Device Deployment Guide

## Current Status
✅ OneSignal is configured correctly for physical devices
✅ All native plugins are properly set up
✅ EAS build configuration is ready

## Why Features Don't Work in Web Preview

The app is currently running in **web preview mode** (as shown in the logs). Many features are designed to work ONLY on physical iOS/Android devices:

### Features That ONLY Work on Physical Devices:
1. **Push Notifications (OneSignal)** - Requires native iOS/Android APIs
2. **Native Permissions** - Camera, location, notifications
3. **Device-specific APIs** - Haptics, device info, native modules
4. **Background Tasks** - Remote notifications, background fetch

### What Works in Web Preview:
- UI/Layout testing
- Navigation flow
- Data fetching from Supabase
- Basic user interactions

## How to Test on Physical Devices

### Option 1: Development Build (Recommended for Testing)
This creates a development APK/IPA that you can install on your device:

**For Android:**
```bash
eas build --profile development --platform android
```

**For iOS:**
```bash
eas build --profile development --platform ios
```

After the build completes:
- **Android**: Download the APK and install it on your device
- **iOS**: Download via TestFlight or direct installation

### Option 2: Preview Build (For Stakeholder Testing)
```bash
# Android APK
eas build --profile preview --platform android

# iOS TestFlight
eas build --profile preview --platform ios
```

### Option 3: Production Build (For App Store Release)
```bash
# Android App Bundle (for Google Play)
eas build --profile production --platform android

# iOS (for App Store)
eas build --profile production --platform ios
```

## Verifying OneSignal on Physical Devices

Once installed on a physical device, OneSignal will:

1. **Initialize automatically** when the app launches
2. **Log detailed information** to the console (visible in development builds)
3. **Request notification permission** when user taps "Enable Notifications"
4. **Register the device** in OneSignal dashboard after permission is granted

### Expected Console Logs on Physical Device:
```
🔔 OneSignal: ========================================
🔔 OneSignal: STARTING INITIALIZATION (RUNTIME MODE)
🔔 OneSignal: ========================================
🔔 OneSignal: Platform: ios (or android)
🔔 OneSignal: Is Device: true
🔔 OneSignal: App ID: b732b467-6886-4c7b-b3d9-5010de1199d6
🔔 OneSignal: Mode: Runtime initialization (no plugin required)
...
🔔 OneSignal: INITIALIZATION COMPLETE ✅
```

### Checking OneSignal Dashboard:
1. Go to https://app.onesignal.com/
2. Select your app (ID: b732b467-6886-4c7b-b3d9-5010de1199d6)
3. Navigate to "Audience" → "All Users"
4. After granting permission on device, user should appear within 1-2 minutes

## Troubleshooting Physical Device Issues

### Issue: "App crashes on launch"
**Solution:**
- Check that you've built with the correct profile
- Ensure all native dependencies are installed
- Verify app.json configuration is correct

### Issue: "OneSignal not initializing"
**Solution:**
- Verify internet connection on device
- Check OneSignal App ID in app.json matches dashboard
- Ensure device is not in airplane mode
- Check device logs for error messages

### Issue: "Notifications not received"
**Solution:**
- Verify notification permission was granted
- Check OneSignal dashboard shows device as subscribed
- Send test notification from OneSignal dashboard
- Ensure device has internet connection

### Issue: "User not appearing in OneSignal dashboard"
**Solution:**
- User must grant notification permission first
- Check that user is logged in (OneSignal.login() is called after auth)
- Verify Player ID is generated (visible in Profile screen)
- Wait 1-2 minutes for dashboard to update

## Current Build Configuration

### Android (eas.json)
```json
"development": {
  "android": {
    "buildType": "apk",
    "gradleCommand": ":app:assembleRelease"
  }
}
```

### iOS (eas.json)
```json
"development": {
  "ios": {
    "simulator": true
  }
}
```

### OneSignal Configuration (app.json)
```json
"extra": {
  "oneSignalAppId": "b732b467-6886-4c7b-b3d9-5010de1199d6"
}
```

## Testing Checklist

Before deploying to physical devices, verify:

- [ ] EAS CLI is installed (`npm install -g eas-cli`)
- [ ] Logged into EAS account (`eas login`)
- [ ] Project is linked to EAS (`eas build:configure`)
- [ ] OneSignal App ID is correct in app.json
- [ ] All dependencies are installed (`npm install`)
- [ ] No TypeScript errors (`npm run lint`)

## Next Steps

1. **Build for your target platform** using one of the commands above
2. **Install on physical device** (APK for Android, TestFlight for iOS)
3. **Test OneSignal** by granting permission and checking dashboard
4. **Send test notification** from OneSignal dashboard to verify delivery

## Important Notes

- **Web preview is NOT representative** of physical device behavior
- **Always test on physical devices** before releasing to production
- **OneSignal requires physical devices** - it will not work in simulators or web
- **Development builds** include debugging tools and detailed logs
- **Production builds** are optimized and have minimal logging

## Support

If issues persist on physical devices:
1. Check device logs for specific error messages
2. Verify OneSignal dashboard shows device registration
3. Test with a fresh app installation
4. Ensure device OS version is supported (iOS 13+, Android 5.0+)
