
# Android APK Push Notification Debugging Guide

## 🚨 Critical Issue: "I didn't get any notifications on Android APK"

This guide will help you debug why push notifications aren't working on your Android APK build.

## Step 1: Verify App Configuration

### Check app.json

Your `app.json` MUST have the OneSignal plugin configured with the `appId` property:

```json
{
  "plugins": [
    [
      "onesignal-expo-plugin",
      {
        "mode": "production",
        "appId": "b732b467-6886-4c7b-b3d9-5010de1199d6"
      }
    ]
  ],
  "extra": {
    "oneSignalAppId": "b732b467-6886-4c7b-b3d9-5010de1199d6"
  },
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "WAKE_LOCK",
      "POST_NOTIFICATIONS"
    ]
  }
}
```

**⚠️ CRITICAL:** The `appId` property in the plugin configuration is REQUIRED for Android builds. Without it, OneSignal won't initialize properly.

### Rebuild if Configuration Changed

If you just added the `appId` property, you MUST rebuild your APK:

```bash
eas build --profile production --platform android
```

## Step 2: Install and Open App

1. Download the new APK from EAS Build
2. Uninstall the old version from your device (if any)
3. Install the new APK
4. Open the app
5. Log in with your account

## Step 3: Grant Notification Permissions

1. Navigate to **Profile** screen (bottom tab bar)
2. Scroll to **התראות** (Notifications) section
3. Tap **"הרשם להתראות פוש"** (Register for Push Notifications)
4. When Android prompts you, tap **"Allow"**
5. You should see an alert: **"התראות הופעלו"** (Notifications Enabled)

## Step 4: Verify OneSignal Initialization

### Check Debug Info in App

In the Profile screen, scroll down to **"מידע טכני (Debug)"** section (only visible in development builds).

**Expected values:**
```
Platform: android
Initialized: Yes
Permission: Granted
Player ID: [a long string like "abc123-def456-..."]
User ID: [your user ID]
```

### Check Console Logs via ADB

Connect your Android device to your computer and run:

```bash
adb logcat | grep "OneSignal"
```

**Expected logs on app start:**
```
🔔 OneSignal: Starting initialization on platform: android
🔔 OneSignal: Calling initialize with App ID: b732b467-6886-4c7b-b3d9-5010de1199d6
🔔 OneSignal: Platform: android
🔔 OneSignal: SDK initialized successfully
🔔 OneSignal: Current permission status: false
🔔 OneSignal: Player ID (device token): null
🔔 OneSignal: Initialization complete. Ready to receive notifications.
```

**Expected logs after granting permission:**
```
🔔 OneSignal: User requested notification permission
🔔 OneSignal: Current state - isInitialized: true hasPermission: false
🔔 OneSignal: Requesting permission from user...
🔔 OneSignal: Permission request result: true
✅ OneSignal: Permission granted! User will receive notifications
🔔 OneSignal: Device registered with Player ID: abc123-def456-...
🔔 OneSignal: Opted in status: true
🔔 OneSignal: ✅ Setup complete! You can now receive push notifications.
🔔 OneSignal: Your Player ID: abc123-def456-...
```

**Expected logs after user login:**
```
🔔 OneSignal: Setting external user ID: [user-id]
🔔 OneSignal: User details: {id: ..., fullName: ..., city: ..., hasContract: ...}
🔔 OneSignal: User logged in successfully
🔔 OneSignal: User tags set successfully
🔔 OneSignal: Push subscription ID after login: abc123-def456-...
```

## Step 5: Send Test Notification

### Get Your Player ID

From the debug section in the Profile screen, copy your **Player ID**.

### Method A: OneSignal Dashboard (Recommended)

1. Go to [OneSignal Dashboard](https://app.onesignal.com)
2. Select your app: **Different**
3. Click **"Messages"** → **"New Push"**
4. Choose **"Send to Test Device"**
5. Paste your **Player ID**
6. Write a test message:
   - **Title:** `בדיקה`
   - **Message:** `זוהי התראת בדיקה מהדשבורד`
7. Click **"Send Message"**

### Method B: OneSignal API

```bash
curl --request POST \
  --url https://onesignal.com/api/v1/notifications \
  --header 'Authorization: Basic YOUR_REST_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "app_id": "b732b467-6886-4c7b-b3d9-5010de1199d6",
    "include_player_ids": ["YOUR_PLAYER_ID_HERE"],
    "contents": {"he": "זוהי התראת בדיקה"},
    "headings": {"he": "בדיקה"}
  }'
```

## Step 6: Verify Notification Received

### If App is in FOREGROUND (open):
- You should see an **Alert dialog** with the notification message
- Console log: `🔔 OneSignal: Notification received in foreground`

### If App is in BACKGROUND or CLOSED:
- You should see a notification in the **Android notification tray**
- Tap it to open the app
- Console log: `🔔 OneSignal: Notification clicked`

## 🐛 Troubleshooting

### Issue: "Initialized: No" in Debug Section

**This means OneSignal SDK failed to initialize.**

**Possible causes:**
1. Missing `appId` in `onesignal-expo-plugin` configuration in app.json
2. App was built before adding the `appId` property
3. Running on web (not supported)

**Solution:**
1. Verify app.json has the correct plugin configuration (see Step 1)
2. **Rebuild the APK** with EAS Build
3. Uninstall old version and install new APK
4. Check console logs for initialization errors

### Issue: "Player ID: Not available" or "Player ID: null"

**This means the device didn't register with OneSignal.**

**Possible causes:**
1. OneSignal SDK didn't initialize (check "Initialized" status)
2. Network connection issues
3. OneSignal servers are down (rare)

**Solution:**
1. Make sure "Initialized: Yes" in debug section
2. Check internet connection
3. Restart the app
4. Check console logs for errors
5. If still null after 30 seconds, rebuild the APK

### Issue: "Permission: Not Granted"

**This means notification permissions weren't granted.**

**Solution:**
1. Go to Android **Settings** → **Apps** → **Different** → **Notifications**
2. Enable **"All Different notifications"**
3. Restart the app
4. Try registering again from Profile screen

### Issue: "No notification received" (but Player ID exists)

**Checklist:**
- [ ] Are you on a **physical Android device**? (Not emulator/web)
- [ ] Did you build with **EAS Build**? (Not Expo Go)
- [ ] Did you grant notification permissions?
- [ ] Is the Player ID showing in the debug section?
- [ ] Did you use the **correct Player ID** when sending?
- [ ] Is the app **not in battery saver mode**?

**Solutions:**
1. **Check device notification settings:**
   - Settings → Apps → Different → Notifications → Enable all
   
2. **Check battery optimization:**
   - Settings → Battery → Battery optimization → Different → Don't optimize
   
3. **Restart the app** after granting permissions

4. **Check OneSignal dashboard:**
   - Go to "Delivery" tab
   - Check if notification was sent successfully
   - Look for delivery errors

5. **Try sending another test notification**

### Issue: "Notifications work in foreground but not background"

**This is EXPECTED behavior:**
- **Foreground:** App shows Alert dialog (custom handling)
- **Background:** Android shows notification in tray (automatic)

**To test background notifications:**
1. Send a test notification from OneSignal dashboard
2. Press **Home button** (minimize app, don't close)
3. You should see notification in Android notification tray
4. Tap it to open the app

### Issue: "Supabase notifications show status 200 but no notification received"

**This means the Edge Function executed successfully, but the notification didn't reach your device.**

**Possible causes:**
1. **Wrong External User ID:** The user's `auth_user_id` in Supabase doesn't match the OneSignal External User ID
2. **User not logged in to OneSignal:** The user needs to log out and log back in to register their External User ID
3. **Player ID changed:** The device got a new Player ID (rare)

**Solution:**

1. **Verify External User ID in OneSignal:**
   - Go to OneSignal Dashboard → **Audience** → **All Users**
   - Search for your user's `auth_user_id` (from Supabase users table)
   - If not found, the user needs to **log out and log back in**

2. **Check Edge Function logs:**
   ```sql
   -- In Supabase SQL Editor
   SELECT auth_user_id, full_name, email FROM users WHERE email = 'your@email.com';
   ```
   - Copy the `auth_user_id`
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for: "Sending notification to external_user_ids: [your-auth-user-id]"

3. **Test with Player ID instead:**
   - Use the Player ID from the debug section
   - Send a test notification directly to the Player ID (Method A above)
   - If this works, the issue is with External User ID mapping

4. **Force re-login:**
   - Log out from the app
   - Close the app completely
   - Open the app and log in again
   - Check OneSignal dashboard to see if External User ID appears

## 📊 Automated Notifications (Supabase Edge Functions)

The app has three automated notification triggers:

### 1. Container Updates
**Trigger:** When `user_containers` table is updated
**Message:** `"עדכון חדש בנוגע למכולה שלך (container_id)"`

**Test:**
```sql
-- In Supabase SQL Editor
UPDATE user_containers 
SET items_ready = NOW() 
WHERE auth_user_id = 'YOUR_AUTH_USER_ID'
LIMIT 1;
```

### 2. Task Approved
**Trigger:** When task status changes from `PENDING` → `DONE`
**Message:** `"נציג אישר את המשימה שביצעת: (task description)"`

**Test:**
```sql
-- First, set a task to PENDING
UPDATE user_tasks 
SET status = 'PENDING' 
WHERE auth_user_id = 'YOUR_AUTH_USER_ID' 
LIMIT 1;

-- Then, approve it (triggers notification)
UPDATE user_tasks 
SET status = 'DONE' 
WHERE auth_user_id = 'YOUR_AUTH_USER_ID' 
AND status = 'PENDING'
LIMIT 1;
```

### 3. Schedule Changes
**Trigger:** When `users` table `schedule` field is updated
**Message:** `"חל עדכון בלוז שלך, יש לעיין מחדש"`

**Test:**
```sql
UPDATE users 
SET schedule = jsonb_set(
  COALESCE(schedule, '{}'::jsonb),
  '{days,2025-02-15}',
  '{"date": "2025-02-15", "events": {}}'::jsonb
)
WHERE auth_user_id = 'YOUR_AUTH_USER_ID';
```

**Check Edge Function execution:**
- Go to Supabase Dashboard → Edge Functions → Logs
- Look for: "Container update webhook received" / "Task update webhook received" / "Schedule update webhook received"
- Check for: "OneSignal response: {success: true}"

## 🔍 Complete Debugging Checklist

Before reporting an issue, verify ALL of these:

### Configuration
- [ ] app.json has `onesignal-expo-plugin` with `appId` property
- [ ] app.json extra has `oneSignalAppId`
- [ ] App ID is `b732b467-6886-4c7b-b3d9-5010de1199d6`
- [ ] Android permissions include `POST_NOTIFICATIONS`

### Build
- [ ] Built with EAS Build (not Expo Go)
- [ ] Built AFTER adding `appId` to app.json
- [ ] Installed on physical Android device (not emulator)
- [ ] Uninstalled old version before installing new APK

### Permissions
- [ ] Granted notification permissions in app
- [ ] Enabled notifications in Android Settings → Apps → Different
- [ ] Disabled battery optimization for the app
- [ ] Not in Do Not Disturb mode

### OneSignal Status
- [ ] Profile screen shows "Initialized: Yes"
- [ ] Profile screen shows "Permission: Granted"
- [ ] Profile screen shows a Player ID (not null)
- [ ] Console logs show "SDK initialized successfully"
- [ ] Console logs show "User logged in successfully"

### Test Notification
- [ ] Copied correct Player ID from debug section
- [ ] Sent test notification from OneSignal dashboard
- [ ] Used correct App ID when sending via API
- [ ] Checked OneSignal dashboard "Delivery" tab for status

### Automated Notifications
- [ ] User's `auth_user_id` exists in OneSignal as External User ID
- [ ] Edge Functions are deployed and active
- [ ] Edge Function logs show successful execution
- [ ] Supabase triggers are active (check pg_net logs)

## 🆘 Still Not Working?

If you've verified ALL items in the checklist and notifications still don't work:

1. **Capture full logs:**
   ```bash
   adb logcat > onesignal_logs.txt
   ```
   - Open the app
   - Grant permissions
   - Send a test notification
   - Stop the log capture (Ctrl+C)
   - Share the log file

2. **Check OneSignal dashboard:**
   - Go to "Delivery" tab
   - Find your test notification
   - Check delivery status and any error messages

3. **Verify OneSignal App ID:**
   - Go to OneSignal Dashboard → Settings → Keys & IDs
   - Confirm App ID matches: `b732b467-6886-4c7b-b3d9-5010de1199d6`

4. **Try a fresh build:**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install`
   - Rebuild with EAS Build
   - Install fresh APK

5. **Test on a different device:**
   - Sometimes device-specific issues occur
   - Try on another Android device to isolate the problem

## 📝 Summary

The most common issue is **missing `appId` in the OneSignal plugin configuration**. If you just added it, you MUST rebuild the APK for it to take effect.

**Quick fix:**
1. Verify app.json has `appId` in `onesignal-expo-plugin`
2. Rebuild: `eas build --profile production --platform android`
3. Install new APK
4. Grant permissions
5. Send test notification

If this doesn't work, follow the complete debugging checklist above.
