
# OneSignal Registration Debugging Guide

## Problem: Device Not Registering with OneSignal

If you're seeing "לא זמין" (Not Available) for Player ID in the profile screen even after granting permissions, this means the device is **NOT** successfully registering with OneSignal servers.

## Critical Diagnostic Steps

### 1. Run Full Diagnostics

1. Open the app on your **physical Android device** (NOT simulator, NOT web)
2. Go to the **Profile** screen
3. Tap the **"🔍 הרץ אבחון מלא (בדוק לוגים)"** button
4. Check the console logs (use `adb logcat` or Expo Dev Tools)

### 2. What to Look For in Logs

The diagnostic will show you:

```
🔔 OneSignal: ========================================
🔔 OneSignal: 🔍 FULL DIAGNOSTIC REPORT
🔔 OneSignal: ========================================
🔔 OneSignal: Platform: android
🔔 OneSignal: Is Physical Device: true
🔔 OneSignal: SDK Initialized: ✅
🔔 OneSignal: Permission Granted: ✅
🔔 OneSignal: Player ID: ❌ NOT AVAILABLE  <-- THIS IS THE PROBLEM
🔔 OneSignal: Push Token: ❌ NOT AVAILABLE  <-- THIS IS THE ROOT CAUSE
🔔 OneSignal: Opted In: ❌
🔔 OneSignal: External User ID: ✅ [user-id]
```

### 3. Understanding the Issue

**If Push Token is ❌ NOT AVAILABLE:**

This is the **ROOT CAUSE**. The Push Token is the FCM (Firebase Cloud Messaging) token that Android uses to receive push notifications. Without it, OneSignal cannot register the device.

**Possible Causes:**

1. **APK Not Built with OneSignal Native Modules**
   - The APK was not built using EAS Build with the OneSignal plugin
   - Solution: Rebuild the APK with `eas build -p android --profile preview`

2. **Google Play Services Not Available**
   - The device doesn't have Google Play Services installed
   - Common on Chinese Android devices or custom ROMs
   - Solution: Install Google Play Services or test on a different device

3. **Network Connectivity Issues**
   - The device cannot reach Google's FCM servers
   - Solution: Check internet connection, try different network

4. **OneSignal Configuration Error**
   - The OneSignal App ID is incorrect
   - The OneSignal plugin is not properly configured
   - Solution: Verify `app.json` has correct `oneSignalAppId` in `extra`

5. **APK Built Without Plugins**
   - The APK was built without running the Expo config plugins
   - Solution: Ensure `app.json` has `onesignal-expo-plugin` in `plugins` array

## Step-by-Step Fix

### Step 1: Verify app.json Configuration

Check that `app.json` has:

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
    },
    "android": {
      "permissions": [
        "POST_NOTIFICATIONS"
      ]
    }
  }
}
```

### Step 2: Rebuild the APK

**CRITICAL:** You MUST rebuild the APK with EAS Build for OneSignal to work.

The APK must be built with:
- `onesignal-expo-plugin` configured
- Native modules compiled
- OneSignal App ID injected into AndroidManifest.xml

**How to rebuild:**
1. Make sure you have the latest code
2. Run: `eas build -p android --profile preview`
3. Wait for the build to complete
4. Download and install the new APK
5. Test again

### Step 3: Verify Google Play Services

On the Android device:
1. Go to Settings → Apps → Google Play Services
2. Make sure it's installed and up to date
3. If not available, the device cannot receive push notifications

### Step 4: Test with Diagnostics

After rebuilding:
1. Install the new APK
2. Open the app
3. Go to Profile screen
4. Tap "בקש הרשאות התראות" (Request Permissions)
5. Grant permission when prompted
6. Tap "🔍 הרץ אבחון מלא" (Run Full Diagnostics)
7. Check logs for:
   - Push Token: ✅ [token]
   - Player ID: ✅ [player-id]
   - Opted In: ✅

### Step 5: Verify in OneSignal Dashboard

1. Go to https://app.onesignal.com/
2. Select your app
3. Go to "Audience" → "All Users"
4. You should see the device appear with:
   - Player ID
   - External User ID (your Supabase user ID)
   - Tags (user_id, full_name, email, city, has_contract)

## Expected Successful Logs

When everything works correctly, you should see:

```
🔔 OneSignal: ========================================
🔔 OneSignal: 🔔 REQUESTING NOTIFICATION PERMISSION
🔔 OneSignal: ========================================
🔔 OneSignal: Requesting permission from user...
🔔 OneSignal: Permission result: ✅ GRANTED
🔔 OneSignal: ✅ Permission granted! Waiting for Player ID...
🔔 OneSignal: 🔧 FORCING OPT-IN to push notifications...
🔔 OneSignal: ✅ Opt-in successful
🔔 OneSignal: ⏳ Waiting 3 seconds for device registration...
🔔 OneSignal: Player ID after permission: ✅ [player-id]
🔔 OneSignal: Push Token after permission: ✅ [token]...
🔔 OneSignal: Opted In status: ✅ YES
🔔 OneSignal: 🎉🎉🎉 SUCCESS 🎉🎉🎉
🔔 OneSignal: Device is now registered with OneSignal!
🔔 OneSignal: Player ID: [player-id]
🔔 OneSignal: Push Token: [token]...
🔔 OneSignal: Check OneSignal dashboard - device should appear
```

## Common Error Messages

### "No Push Token"
**Cause:** FCM token not generated
**Fix:** Rebuild APK with OneSignal plugin, verify Google Play Services

### "Player ID not available yet"
**Cause:** OneSignal SDK hasn't completed registration
**Fix:** Wait a few seconds, check network connection

### "SDK not initialized"
**Cause:** OneSignal.initialize() failed
**Fix:** Check App ID, rebuild APK

### "Permission denied"
**Cause:** User denied notification permission
**Fix:** Go to device Settings → Apps → [Your App] → Notifications → Enable

## Testing Checklist

- [ ] Using physical Android device (not simulator)
- [ ] APK built with EAS Build (not Expo Go)
- [ ] `onesignal-expo-plugin` in app.json plugins
- [ ] OneSignal App ID in app.json extra
- [ ] Google Play Services installed on device
- [ ] Device connected to internet
- [ ] Notification permission granted
- [ ] Ran full diagnostics from Profile screen
- [ ] Push Token shows ✅ in logs
- [ ] Player ID shows ✅ in logs
- [ ] Device appears in OneSignal dashboard

## Still Not Working?

If you've completed all steps and it still doesn't work:

1. **Check OneSignal Dashboard for Errors**
   - Go to Settings → Keys & IDs
   - Verify the App ID matches app.json
   - Check for any error messages

2. **Try a Different Device**
   - Some devices (especially Chinese brands) have aggressive battery optimization
   - Try on a Google Pixel or Samsung device

3. **Check Firewall/Network**
   - Make sure the device can reach:
     - `fcm.googleapis.com` (Google FCM)
     - `onesignal.com` (OneSignal API)

4. **Review Build Logs**
   - Check EAS Build logs for any OneSignal plugin errors
   - Look for "onesignal" in the build output

## Summary

The key issue is that **Push Token is not being generated**, which means the device cannot register with OneSignal. This is almost always caused by:

1. APK not built with OneSignal native modules (most common)
2. Google Play Services not available
3. Network connectivity issues

**The solution is to rebuild the APK with EAS Build** and ensure all OneSignal plugins are properly configured.
