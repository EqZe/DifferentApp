
# OneSignal Physical Device Testing Guide

## 🚨 CRITICAL: OneSignal ONLY Works on Physical Devices

OneSignal push notifications **DO NOT WORK** on:
- ❌ Web browsers
- ❌ iOS Simulator
- ❌ Android Emulator
- ❌ Expo Go (limited support)

OneSignal push notifications **ONLY WORK** on:
- ✅ Physical iOS devices (iPhone, iPad)
- ✅ Physical Android devices
- ✅ Development builds (APK/IPA installed on device)

## Current Issue Diagnosis

Based on the logs and Edge Function response, here's what's happening:

### ✅ What's Working:
1. **Edge Function executes successfully** - Returns 200 status
2. **Edge Function reaches OneSignal API** - Makes the API call
3. **App is properly configured** - OneSignal App ID is correct
4. **User is authenticated** - User ID: `414fe7bc-9d62-4540-ad60-739be7867efe`

### ❌ What's NOT Working:
1. **User is testing on WEB** - Logs show `Platform.OS = web`
2. **OneSignal is not initialized on web** - OneSignal skips initialization on web
3. **User is NOT registered in OneSignal** - No external_user_id handshake completed
4. **No device token** - User has no Player ID (device subscription ID)

### 🔍 Root Cause:
The Edge Function is trying to send a notification to a user who:
- Has never opened the app on a physical device
- Has never granted notification permissions
- Is not registered in the OneSignal dashboard
- Has no device token to receive notifications

## How to Fix: Testing on Physical Devices

### Step 1: Build and Install on Physical Device

You need to create a development build and install it on a physical device:

**For Android (APK):**
The APK has already been built. Install it on your Android phone.

**For iOS (IPA):**
You'll need to build an IPA and install it via TestFlight or direct installation.

### Step 2: Open App on Physical Device

1. **Install the app** on your physical device
2. **Open the app** - OneSignal will initialize automatically
3. **Login with your account** - Use the same credentials (rachko8@gmail.com)
4. **Grant notification permissions** when prompted

### Step 3: Verify OneSignal Registration

After opening the app on a physical device, check the Profile screen:

**Expected Status (Success):**
```
מצב התראות (OneSignal)
מערכת מאותחלת: כן ✅
הרשאות: ניתנו ✅
מזהה מכשיר: [long alphanumeric ID]
מזהה משתמש: 414fe7bc-9d62-4540-ad60-739be7867efe
סטטוס כללי: פעיל ✅
```

**Current Status (Web - Not Working):**
```
מצב התראות (OneSignal)
מערכת מאותחלת: לא ❌
הרשאות: לא ניתנו ❌
מזהה מכשיר: לא זמין
מזהה משתמש: 414fe7bc-9d62-4540-ad60-739be7867efe
סטטוס כללי: לא פעיל ❌
```

### Step 4: Verify in OneSignal Dashboard

1. Go to https://dashboard.onesignal.com/
2. Select your app (App ID: `b732b467-6886-4c7b-b3d9-5010de1199d6`)
3. Go to **Audience** → **All Users**
4. Search for your user by:
   - External User ID: `414fe7bc-9d62-4540-ad60-739be7867efe`
   - Email: `rachko8@gmail.com`

**If the user appears in the dashboard:**
✅ OneSignal handshake is complete
✅ Notifications will work

**If the user does NOT appear:**
❌ User has not opened the app on a physical device
❌ OneSignal.login() was not called
❌ Notifications will NOT work

### Step 5: Test Notification Sending

Once the user is registered in OneSignal (appears in dashboard), test notifications:

**Method 1: OneSignal Dashboard (Manual Test)**
1. Go to OneSignal Dashboard → **Messages** → **New Push**
2. Select **Send to Particular Users**
3. Enter External User ID: `414fe7bc-9d62-4540-ad60-739be7867efe`
4. Write a test message
5. Send

**Method 2: Trigger from App (Task Approval)**
1. Go to Tasks screen
2. Mark a task as "PENDING" (if requires_pending is true)
3. Admin approves the task (changes status to DONE)
4. Edge Function triggers automatically
5. Notification should appear on device

## Debugging Checklist

### On Physical Device:
- [ ] App is installed from APK/IPA (not Expo Go)
- [ ] App is opened and user is logged in
- [ ] Notification permission prompt appeared
- [ ] User granted notification permissions
- [ ] Profile screen shows "מערכת מאותחלת: כן"
- [ ] Profile screen shows "הרשאות: ניתנו"
- [ ] Profile screen shows a Player ID (device token)

### In OneSignal Dashboard:
- [ ] User appears in Audience → All Users
- [ ] User has External User ID: `414fe7bc-9d62-4540-ad60-739be7867efe`
- [ ] User has at least one device subscription
- [ ] Device subscription is "Subscribed" (not "Unsubscribed")

### In Supabase:
- [ ] Edge Function `send-task-approved-notification` exists
- [ ] Edge Function has environment variable `ONESIGNAL_REST_API_KEY` set
- [ ] Database trigger on `user_tasks` table fires on status change
- [ ] Edge Function logs show successful OneSignal API call

## Common Issues and Solutions

### Issue: "מערכת מאותחלת: לא"
**Cause:** Running on web/simulator or OneSignal failed to initialize
**Solution:** Open app on physical device

### Issue: "הרשאות: לא ניתנו"
**Cause:** User denied notification permissions or never prompted
**Solution:** 
1. Tap "בקש הרשאות התראות" button in Profile screen
2. Or go to device Settings → App → Notifications → Enable

### Issue: User not in OneSignal dashboard
**Cause:** OneSignal.login() was never called or failed
**Solution:**
1. Check console logs for "🔔 OneSignal: HANDSHAKE COMPLETE"
2. Ensure user is logged in (not guest)
3. Restart app and check logs again

### Issue: Edge Function returns 200 but no notification
**Cause:** User is not registered in OneSignal (no external_user_id)
**Solution:**
1. Verify user appears in OneSignal dashboard
2. Check that External User ID matches `auth_user_id` from database
3. Ensure device subscription is "Subscribed"

### Issue: Notification sent but not received
**Cause:** Device is offline, Do Not Disturb, or notification settings disabled
**Solution:**
1. Check device is connected to internet
2. Check Do Not Disturb is off
3. Check app notification settings are enabled
4. Try sending a test notification from OneSignal dashboard

## Expected Console Logs (Physical Device)

When the app opens on a physical device, you should see:

```
🔔 OneSignal: ========================================
🔔 OneSignal: STARTING INITIALIZATION (RUNTIME MODE)
🔔 OneSignal: ========================================
🔔 OneSignal: Platform: ios (or android)
🔔 OneSignal: Is Device: true
🔔 OneSignal: App ID: b732b467-6886-4c7b-b3d9-5010de1199d6
🔔 OneSignal: Mode: Runtime initialization (no plugin required)
🔔 OneSignal: Step 1 - Calling OneSignal.initialize()
🔔 OneSignal: Step 2 - Setting log level to verbose
🔔 OneSignal: Step 3 - Waiting for SDK to initialize...
🔔 OneSignal: Step 4 - Checking permission status
🔔 OneSignal: Permission status: true (or false)
🔔 OneSignal: Step 5 - Getting Player ID
🔔 OneSignal: Player ID: [alphanumeric-id]
🔔 OneSignal: ========================================
🔔 OneSignal: INITIALIZATION COMPLETE ✅
🔔 OneSignal: ========================================
```

Then when user logs in:

```
🔔 OneSignal: ========================================
🔔 OneSignal: SETTING EXTERNAL USER ID (HANDSHAKE)
🔔 OneSignal: ========================================
🔔 OneSignal: User ID: 414fe7bc-9d62-4540-ad60-739be7867efe
🔔 OneSignal: Step 1 - Calling OneSignal.login()
🔔 OneSignal: ✅ User logged in with external ID
🔔 OneSignal: Step 2 - Setting user tags
🔔 OneSignal: ✅ User tags set successfully
🔔 OneSignal: Step 3 - Setting user email
🔔 OneSignal: ✅ User email set
🔔 OneSignal: ========================================
🔔 OneSignal: HANDSHAKE COMPLETE ✅
🔔 OneSignal: User should now be visible in OneSignal dashboard
🔔 OneSignal: ========================================
```

## Next Steps

1. **Install the APK on a physical Android device**
2. **Open the app and login**
3. **Grant notification permissions**
4. **Check the Profile screen** - Verify all statuses are green (✅)
5. **Check OneSignal dashboard** - Verify user appears in Audience
6. **Test notification** - Send a test notification from OneSignal dashboard
7. **Test Edge Function** - Approve a task and verify notification is received

## Support

If notifications still don't work after following this guide:

1. **Check console logs** - Look for any error messages
2. **Check OneSignal dashboard** - Verify user is registered
3. **Check Edge Function logs** - Verify OneSignal API response
4. **Check device settings** - Verify notifications are enabled
5. **Try a different device** - Rule out device-specific issues

Remember: **OneSignal ONLY works on physical devices!** Testing on web/simulator will always fail.
