
# Push Notification Fix Summary

## Issue Reported
User changed a task status from PENDING to DONE in the database but did not receive a notification. Additionally, the `push_token` field was NULL in the database.

## Root Cause Analysis

### 1. **Push Token is NULL**
- The user's `push_token` field in the `users` table is NULL
- Push tokens can only be obtained on **physical devices** (not simulators/emulators)
- The app was likely tested on a simulator where push token registration fails

### 2. **Edge Function Rejects NULL Tokens**
- When a task status changes from PENDING → DONE, the database trigger fires
- The trigger calls the `notify_push` PostgreSQL function
- `notify_push` calls the `send-push-notification` Edge Function
- The Edge Function looks up the user's `push_token` from the database
- If `push_token` is NULL, the Edge Function returns a 400 error: "No push token registered for user"
- **Result:** No notification is sent

### 3. **Logs Confirm the Issue**
Edge Function logs show:
```
POST | 400 | https://pgrcmurwamszgjsdbgtq.supabase.co/functions/v1/send-push-notification
```
This 400 status code indicates the push token was missing.

## Fixes Implemented

### 1. **Fixed Syntax Error** ✅
- Fixed parsing error on line 380 of `utils/notifications.ts`
- The linting error is now resolved

### 2. **Added Manual Push Notification Registration** ✅
- Added "הירשם להתראות" (Register for Notifications) button in Profile screen
- Users can manually trigger push notification registration
- Button shows loading state while registering
- Success/error alerts inform the user of the result

### 3. **Added Push Token Status Display** ✅
- Profile screen now shows push notification status:
  - 🟢 "רשום להתראות ✓" (green) - Token registered
  - 🔴 "לא רשום להתראות" (red) - Token not registered
- Users can see at a glance if they're registered for notifications

### 4. **Exposed `registerPushNotifications` Function** ✅
- Added `registerPushNotifications` to UserContext
- Can be called from any component
- Returns the push token or null if registration fails

### 5. **Enhanced Logging** ✅
- All notification operations now log detailed information
- Logs include:
  - 🔔 Push token registration attempts
  - 🔔 Permission requests
  - 🔔 Token save operations
  - 🔔 Success/failure messages
- Logs use emoji prefixes for easy identification

## How Push Notifications Work

### Architecture
```
┌─────────────────────────────────────────────────────────────┐
│ 1. User logs in on physical device                          │
│    → UserContext calls registerForPushNotificationsAsync()  │
│    → Requests notification permissions                      │
│    → Gets Expo push token                                   │
│    → Saves token to users.push_token via api.savePushToken()│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Admin changes task status: PENDING → DONE                │
│    → Database trigger "task_approved_notification" fires    │
│    → Calls trigger_task_approved_notification() function    │
│    → Calls notify_push(user_id, title, body, data)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. notify_push() PostgreSQL function                         │
│    → Makes HTTP POST to Edge Function                       │
│    → Sends: { userId, title, body, data }                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. send-push-notification Edge Function                     │
│    → Looks up user's push_token from database               │
│    → If push_token is NULL → Return 400 error               │
│    → If push_token exists → Send to Expo Push API           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Expo Push API                                             │
│    → Delivers notification to user's device                 │
│    → User sees notification: "נציג אישר את המשימה שביצעת"   │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema
```sql
-- users table
CREATE TABLE users (
  auth_user_id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  push_token TEXT, -- Expo push token (NULL if not registered)
  ...
);

-- Trigger on user_tasks table
CREATE TRIGGER task_approved_notification
AFTER UPDATE ON user_tasks
FOR EACH ROW
EXECUTE FUNCTION trigger_task_approved_notification();
```

### Edge Function
```typescript
// send-push-notification Edge Function
// 1. Receives: { userId, title, body, data }
// 2. Looks up push_token from users table
// 3. If push_token is NULL → Return 400 error
// 4. If push_token exists → Send to Expo Push API
```

## User Instructions

### To Receive Push Notifications:

1. **Use a Physical Device** 📱
   - Push notifications **DO NOT work** on simulators/emulators
   - You must use a real iPhone or Android device
   - Install the app via Expo Go or a development build

2. **Grant Notification Permissions** 🔔
   - When the app asks for notification permissions, tap "Allow"
   - On iOS: Settings → [App Name] → Notifications → Allow Notifications
   - On Android: Settings → Apps → [App Name] → Notifications → Allow

3. **Register for Notifications** ✅
   - Open the app and go to the Profile screen (פרופיל)
   - Look for the "התראות" (Notifications) section
   - If status shows "לא רשום להתראות" (red), tap "הירשם להתראות"
   - Wait for the success message: "הרישום להתראות הושלם בהצלחה"
   - Status should change to "רשום להתראות ✓" (green)

4. **Test Notifications** 🧪
   - Tap "שלח התראת בדיקה" (Send Test Notification) button
   - You should receive 3 test notifications:
     - 📅 7-day reminder (immediate)
     - ⚠️ 3-day reminder (after 2 seconds)
     - 🚨 1-day reminder (after 4 seconds)
   - Check your notification tray

5. **Verify Database** 🗄️
   - Admin can check the database:
   ```sql
   SELECT auth_user_id, full_name, push_token 
   FROM users 
   WHERE auth_user_id = 'USER_ID';
   ```
   - `push_token` should contain an Expo push token like:
     `ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]`

## Troubleshooting

### "לא ניתן לרשום להתראות" Error
**Cause:** App is running on simulator or permissions denied
**Solution:**
- Use a physical device
- Grant notification permissions in device settings
- Restart the app and try again

### Push Token Still NULL After Registration
**Cause:** Network error or Expo configuration issue
**Solution:**
- Check internet connection
- Verify app is running on physical device
- Check console logs for detailed error messages
- Try logging out and logging back in

### Notification Not Received After Task Status Change
**Cause:** Push token is NULL or Edge Function error
**Solution:**
1. Verify push token is registered (check Profile screen)
2. Check Edge Function logs:
   ```
   Supabase Dashboard → Edge Functions → send-push-notification → Logs
   ```
3. Look for 400 errors (missing token) or 500 errors (server error)

### Test Notifications Work But Real Notifications Don't
**Cause:** Database trigger or Edge Function issue
**Solution:**
1. Check if trigger is enabled:
   ```sql
   SELECT tgname, tgenabled 
   FROM pg_trigger 
   WHERE tgname = 'task_approved_notification';
   ```
2. Check Edge Function logs for errors
3. Verify Edge Function has correct environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Testing Checklist

- [ ] User logs in on physical device
- [ ] Notification permissions granted
- [ ] Push token registered (Profile screen shows green status)
- [ ] Test notification button works (3 notifications received)
- [ ] Database shows push_token is not NULL
- [ ] Admin changes task status PENDING → DONE
- [ ] User receives notification: "נציג אישר את המשימה שביצעת: [task description]"
- [ ] Edge Function logs show 200 status code (success)

## Files Modified

1. **utils/notifications.ts**
   - Fixed syntax error on line 380
   - Enhanced logging with emoji prefixes
   - Improved error handling

2. **contexts/UserContext.tsx**
   - Added `registerPushNotifications` to context interface
   - Exposed manual registration function
   - Enhanced logging

3. **app/(tabs)/profile.tsx**
   - Added push notification status display
   - Added "הירשם להתראות" button
   - Added "שלח התראת בדיקה" button
   - Added success/error alerts

4. **app/(tabs)/profile.ios.tsx**
   - Same changes as profile.tsx for iOS

## Next Steps

1. **Test on Physical Device** - User should test on a real device
2. **Verify Registration** - Check that push_token is saved in database
3. **Test Task Approval** - Admin should change a task status and verify notification is received
4. **Monitor Logs** - Check Edge Function logs for any errors

## Additional Notes

- Push notifications require **Expo Go** or a **development build** on a physical device
- Simulators/emulators cannot receive push notifications
- The app automatically attempts to register for push notifications on login
- Users can manually re-register at any time from the Profile screen
- All notification operations are logged for debugging

---

**Status:** ✅ Fixed and Ready for Testing
**Date:** 2025-01-29
**Priority:** High - Core functionality for user engagement
