
# 🔔 Push Notifications Setup Guide

This guide explains how to set up push notifications with EAS and Supabase for the Different app.

## 📋 Prerequisites

1. **EAS Account**: You need an Expo Application Services (EAS) account
2. **Physical Device**: Push notifications don't work on simulators/emulators
3. **Supabase Project**: Your Supabase project is already configured

## 🚀 Setup Steps

### Step 1: Get Your EAS Project ID

Your app needs an EAS project ID to send push notifications. To get it:

1. Make sure you have EAS CLI installed globally (already in your dependencies)
2. The project ID should be visible in your EAS dashboard at https://expo.dev
3. Or you can find it by looking at your project settings

**Current Configuration**: The app.json already includes a project ID: `fe404aca-e46f-42c2-ac3a-50c265d87ae7`

### Step 2: Verify EAS Project ID in app.json

The `app.json` now includes the EAS project ID:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "fe404aca-e46f-42c2-ac3a-50c265d87ae7"
      }
    }
  }
}
```

**✅ This is already configured in your app.json!**

### 🚨 Testing on Android APK

When testing push notifications on Android APK (not Expo Go), the EAS project ID is **critical**. If you get the error:

**"לא ניתן לקבל טוקן הרשאות. אנא צור קשר עם התמיכה."**
(Cannot obtain authorization token. Please contact support.)

This means the APK cannot get a push token. Here's how to fix it:

#### Option 1: Verify Your EAS Project ID
1. Check if `fe404aca-e46f-42c2-ac3a-50c265d87ae7` is your actual EAS project ID
2. If not, update it in `app.json` under `extra.eas.projectId`
3. Rebuild the APK with the correct project ID

#### Option 2: Check APK Build Configuration
Make sure you built the APK with EAS Build:
```bash
# For preview/testing APK
eas build --platform android --profile preview

# For production
eas build --platform android --profile production
```

**Do NOT use `expo build:android`** - it's deprecated and won't include the EAS project ID.

#### Debugging APK Issues
The app now includes detailed logging. When you click "הירשם להתראות" (Register for notifications) on your Android device:

1. Connect your device via USB
2. Run `adb logcat | grep "Notifications:"` to see the logs
3. Look for:
   - `🔔 Notifications: EAS Project ID from Constants:` - Shows if the project ID is being read
   - `🔔 Notifications: Token options:` - Shows what's being passed to the API
   - Any error messages with specific details

Common APK errors:
- **"Project ID error"**: The APK was built without a valid EAS project ID
- **"Experience/manifest error"**: APK configuration issue - rebuild with EAS
- **"Network error"**: Check internet connection on the device

### Step 3: Database Schema (Already Set Up ✅)

Your Supabase `users` table already has the `push_token` column:

```sql
-- users table
CREATE TABLE users (
  auth_user_id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  has_contract BOOLEAN DEFAULT false,
  travel_date DATE,
  push_token TEXT,  -- ✅ This stores the Expo push token
  schedule JSONB,
  schedule_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 4: How It Works

#### Automatic Registration
When a user logs in, the app automatically attempts to register for push notifications after 3 seconds:

1. **User logs in** → `UserContext` loads user profile
2. **Check push_token** → If `push_token` is NULL in database
3. **Auto-register** → After 3-second delay, call `registerForPushNotificationsAsync()`
4. **Save token** → Token is saved to Supabase `users.push_token` column
5. **Update UI** → User profile refreshes to show registration status

#### Manual Registration
Users can also manually register from the Profile screen:

1. Navigate to **Profile** tab
2. If not registered, see "Register for Notifications" button
3. Tap button → Request permissions → Get token → Save to database
4. Success/error message displayed

## 🔧 Implementation Details

### Frontend Files

#### `utils/notifications.ts`
- `registerForPushNotificationsAsync()`: Main registration function
  - Checks if device is physical
  - Requests notification permissions
  - Gets Expo push token using EAS project ID
  - Returns token (caller saves to database)
  
- `sendTestTaskReminders()`: Test function for local notifications
- `scheduleLocalNotification()`: Schedule a local notification
- `showImmediateNotification()`: Show immediate notification

#### `contexts/UserContext.tsx`
- Automatic registration logic (3-second delay after login)
- `registerPushNotifications()`: Exposed function for manual registration
- `isRegisteringPush`: Loading state for UI feedback

#### `utils/api.ts`
- `savePushToken(authUserId, pushToken)`: Saves token to Supabase

#### `app/(tabs)/profile.tsx` & `profile.ios.tsx`
- UI for manual registration
- Shows registration status
- Test notification button (for development)

### Token Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User logs in                                             │
│    ↓                                                         │
│ 2. UserContext.loadUserProfile() called                     │
│    ↓                                                         │
│ 3. Check if user.push_token is NULL                         │
│    ↓                                                         │
│ 4. If NULL: setTimeout(() => registerPushToken(), 3000)     │
│    ↓                                                         │
│ 5. registerForPushNotificationsAsync()                      │
│    - Check Device.isDevice (must be physical)               │
│    - Request permissions                                    │
│    - Get Expo push token with EAS projectId                 │
│    ↓                                                         │
│ 6. api.savePushToken(authUserId, token)                     │
│    - UPDATE users SET push_token = ? WHERE auth_user_id = ? │
│    ↓                                                         │
│ 7. Refresh user data in context                             │
│    ↓                                                         │
│ 8. UI updates to show "Registered ✅"                        │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Platform-Specific Notes

### iOS
- Requires physical device (not simulator)
- User must grant notification permissions
- Background modes enabled in `app.json`:
  ```json
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"]
    }
  }
  ```

### Android
- Requires physical device (not emulator)
- Notification channel created automatically
- Permissions added to `app.json`:
  ```json
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "WAKE_LOCK",
      "POST_NOTIFICATIONS"
    ]
  }
  ```

### Expo Go
- Works in Expo Go for development
- Uses `experienceId` instead of `projectId`
- Format: `@owner/slug` (e.g., `@different/Different`)

## 🧪 Testing Push Notifications

### Local Notifications (Testing)
From the Profile screen, tap "Test Notification" to send 3 local notifications:
1. 7-day reminder (immediate)
2. 3-day reminder (after 2 seconds)
3. 1-day reminder (after 4 seconds)

These are **local notifications** (not push) and work on simulators for testing UI.

### Real Push Notifications
To test real push notifications:

1. **Get a push token**: Register on a physical device
2. **Send via Expo Push Tool**: https://expo.dev/notifications
   - Enter your Expo push token
   - Enter title and message
   - Send notification
3. **Or use Expo's API**:
   ```bash
   curl -H "Content-Type: application/json" \
        -X POST https://exp.host/--/api/v2/push/send \
        -d '{
          "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
          "title": "Test Notification",
          "body": "This is a test from the API"
        }'
   ```

## 🔐 Security & RLS

The `users` table has Row Level Security (RLS) enabled. Users can only:
- **Read** their own `push_token`
- **Update** their own `push_token`

RLS policies ensure users cannot see or modify other users' push tokens.

## 🐛 Troubleshooting

### "Must use physical device"
- **Cause**: Running on simulator/emulator
- **Solution**: Test on a real iOS or Android device

### "No valid EAS project ID found"
- **Cause**: Missing or invalid `projectId` in `app.json`
- **Solution**: Add your EAS project ID to `app.json` under `extra.eas.projectId`

### "Permission not granted"
- **Cause**: User denied notification permissions
- **Solution**: Go to device Settings → Different → Notifications → Enable

### Token registration fails silently
- **Check**: Console logs in `utils/notifications.ts` (search for 🔔)
- **Check**: Supabase logs for database errors
- **Check**: Network connectivity

### Push token is NULL after registration
- **Check**: `api.savePushToken()` logs
- **Check**: Supabase RLS policies allow UPDATE on `users.push_token`
- **Check**: User is authenticated (session exists)

## 📊 Monitoring

### Check Registration Status
In the Profile screen, you'll see:
- ✅ **"Registered for notifications"** (green) - Token exists in database
- ⚠️ **"Not registered"** (orange) - No token, with "Register" button
- 🔄 **Loading spinner** - Registration in progress

### Database Query
Check registered users in Supabase:
```sql
SELECT 
  full_name, 
  email, 
  push_token IS NOT NULL as is_registered,
  created_at
FROM users
ORDER BY created_at DESC;
```

### Logs
All notification operations are logged with 🔔 prefix:
- Registration attempts
- Permission requests
- Token retrieval
- Database saves
- Errors

Search your console for `🔔 Notifications:` to see the full flow.

## 🚀 Sending Push Notifications from Backend

When you want to send push notifications from your backend (e.g., for task reminders):

1. **Query users with push tokens**:
   ```sql
   SELECT auth_user_id, push_token, full_name
   FROM users
   WHERE push_token IS NOT NULL
     AND has_contract = true;
   ```

2. **Send via Expo Push API**:
   ```javascript
   const { Expo } = require('expo-server-sdk');
   const expo = new Expo();
   
   const messages = [];
   for (let pushToken of somePushTokens) {
     if (!Expo.isExpoPushToken(pushToken)) {
       console.error(`Invalid push token: ${pushToken}`);
       continue;
     }
     
     messages.push({
       to: pushToken,
       sound: 'default',
       title: 'תזכורת משימה',
       body: 'יש לך משימה שצריכה טיפול',
       data: { taskId: '123' },
     });
   }
   
   const chunks = expo.chunkPushNotifications(messages);
   for (let chunk of chunks) {
     try {
       const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
       console.log(ticketChunk);
     } catch (error) {
       console.error(error);
     }
   }
   ```

## 📚 Resources

- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
- [EAS Documentation](https://docs.expo.dev/eas/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

## ✅ Checklist

Before deploying to production:

- [ ] EAS project ID added to `app.json`
- [ ] Tested registration on physical iOS device
- [ ] Tested registration on physical Android device
- [ ] Verified tokens are saved to Supabase
- [ ] Tested sending push notifications via Expo tool
- [ ] RLS policies verified for `users.push_token`
- [ ] Error handling tested (denied permissions, network errors)
- [ ] Automatic registration works after login
- [ ] Manual registration works from Profile screen

---

**Need Help?**
- Check console logs (search for 🔔)
- Review Supabase logs
- Test with Expo Push Notification Tool
- Verify EAS project ID is correct
