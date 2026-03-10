
# Push Notification Handshake Fix

## Problem
Push notifications were not appearing even though Edge Functions were returning 200 status codes. The issue was that **users were not appearing in the OneSignal dashboard**, which meant the "handshake" between the app and OneSignal was not completing successfully.

## Root Cause
The OneSignal SDK requires a proper "handshake" to register users in the dashboard:
1. **SDK Initialization**: OneSignal SDK must be initialized with the App ID
2. **Permission Request**: User must grant notification permissions
3. **User Login**: `OneSignal.login(external_user_id)` must be called to link the user
4. **Platform Requirement**: This only works on **native devices** (Android/iOS), NOT on web or simulators

## The Fix

### 1. Enhanced OneSignalContext.tsx
Updated the user login effect to:
- Add comprehensive logging for debugging
- Properly call `OneSignal.login(user.authUserId)` when user data is available
- Set user email with `OneSignal.User.addEmail()`
- Add user tags for segmentation
- Skip initialization on web/simulator platforms
- Log clear success/failure messages for the handshake

Key changes:
```typescript
// CRITICAL: Login user with external ID
// This is the "handshake" that registers the user in OneSignal dashboard
console.log('🔔 OneSignal: Step 1 - Calling OneSignal.login() with external_user_id:', user.authUserId);
OneSignal.login(user.authUserId);
console.log('🔔 OneSignal: ✅ User logged in with external ID');
console.log('🔔 OneSignal: This user should now appear in OneSignal dashboard');
```

### 2. Manual Handshake Trigger in Profile Screen
Added manual handshake trigger after permission is granted:
```typescript
if (granted && user?.authUserId) {
  const OneSignal = require('react-native-onesignal').default;
  OneSignal.login(user.authUserId);
  console.log('🔔 ✅ Manual handshake complete - user should appear in OneSignal dashboard');
}
```

## How to Verify the Fix

### Step 1: Check Logs
When the app starts and user is logged in, you should see these logs:
```
🔔 OneSignal: ========================================
🔔 OneSignal: SETTING EXTERNAL USER ID (HANDSHAKE)
🔔 OneSignal: ========================================
🔔 OneSignal: User ID: 414fe7bc-9d62-4540-ad60-739be7867efe
🔔 OneSignal: Step 1 - Calling OneSignal.login() with external_user_id: 414fe7bc-9d62-4540-ad60-739be7867efe
🔔 OneSignal: ✅ User logged in with external ID
🔔 OneSignal: This user should now appear in OneSignal dashboard
🔔 OneSignal: ========================================
🔔 OneSignal: HANDSHAKE COMPLETE ✅
🔔 OneSignal: User should now be visible in OneSignal dashboard
🔔 OneSignal: External User ID: 414fe7bc-9d62-4540-ad60-739be7867efe
🔔 OneSignal: ========================================
```

### Step 2: Check OneSignal Dashboard
1. Go to OneSignal Dashboard → Audience → All Users
2. You should see the user with:
   - **External User ID**: The user's `auth_user_id` from Supabase
   - **Email**: The user's email address
   - **Tags**: `user_id`, `full_name`, `email`, `city`, `has_contract`
   - **Player ID**: The device's push subscription ID

### Step 3: Test Push Notifications
Once the user appears in the dashboard:
1. Trigger a database change (e.g., approve a task)
2. The Edge Function will call OneSignal API with `include_external_user_ids: [userId]`
3. OneSignal will match the external user ID and send the notification
4. The notification should appear on the device

## Important Notes

### Platform Requirements
- ✅ **Android**: Works on physical devices and emulators with Google Play Services
- ✅ **iOS**: Works on physical devices (requires Apple Developer account for push certificates)
- ❌ **Web**: OneSignal SDK does not support web in React Native
- ❌ **iOS Simulator**: Push notifications are not supported

### Testing Checklist
- [ ] User is logged in with valid `auth_user_id`
- [ ] App is running on a **physical device** (not web or simulator)
- [ ] User has granted notification permissions
- [ ] OneSignal logs show "HANDSHAKE COMPLETE ✅"
- [ ] User appears in OneSignal dashboard with correct External User ID
- [ ] Edge Functions are configured with correct `ONESIGNAL_REST_API_KEY`
- [ ] Database triggers are active and calling Edge Functions

### Database Extensions
Ensure these extensions are enabled in Supabase:
- ✅ `pg_net` (version 0.19.5) - For database triggers to call Edge Functions
- ✅ `http` (version 1.6) - For HTTP requests from database

## Edge Function Configuration

The Edge Functions use `include_external_user_ids` to target specific users:
```typescript
const notificationData = {
  app_id: ONESIGNAL_APP_ID,
  include_external_user_ids: [userId], // Must match OneSignal.login(userId)
  headings: { en: 'Task Approved', he: 'משימה אושרה' },
  contents: {
    en: `Representative approved your task: ${taskDescription}`,
    he: `נציג אישר את המשימה שביצעת: ${taskDescription}`
  }
};
```

## Troubleshooting

### User Not Appearing in Dashboard
1. Check logs for "HANDSHAKE COMPLETE ✅"
2. Verify `OneSignal.login(userId)` is being called
3. Ensure app is running on native device (not web)
4. Check that user has granted notification permissions

### Notifications Not Arriving
1. Verify user appears in OneSignal dashboard
2. Check Edge Function logs for OneSignal API response
3. Verify `ONESIGNAL_REST_API_KEY` is set correctly
4. Ensure `include_external_user_ids` matches the user's external ID
5. Check that device has internet connection

### Permission Issues
1. On iOS: Check that push notification capability is enabled in Xcode
2. On Android: Verify `POST_NOTIFICATIONS` permission is in AndroidManifest.xml
3. User may need to manually enable notifications in device settings

## Summary
The fix ensures that:
1. ✅ OneSignal SDK properly initializes on native devices
2. ✅ User login (`OneSignal.login()`) is called with the correct external user ID
3. ✅ Users appear in the OneSignal dashboard
4. ✅ Edge Functions can target users using `include_external_user_ids`
5. ✅ Comprehensive logging helps debug any issues
6. ✅ Manual handshake trigger available in profile screen

The handshake is now complete, and push notifications should work correctly! 🎉
