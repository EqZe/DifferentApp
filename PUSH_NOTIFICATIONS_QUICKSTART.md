
# Push Notifications Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Get Expo Access Token
1. Go to https://expo.dev/accounts/[your-username]/settings/access-tokens
2. Create a new token with "Push Notifications" permission
3. Copy the token

### 2. Add Token to Supabase
1. Go to Supabase Dashboard → Settings → Edge Functions → Environment Variables
2. Add secret:
   - Name: `EXPO_ACCESS_TOKEN`
   - Value: [your token from step 1]
3. Save

### 3. Test on Physical Device
1. Open app on **physical device** (not simulator!)
2. Log in
3. Go to Profile screen
4. Tap "הירשם להתראות" (Register for Notifications)
5. Grant permissions
6. Tap "שלח התראה דרך Supabase" (Send Test Notification)
7. Check that you receive the notification

## ✅ That's it!

Your push notifications are now working via Supabase!

## 📱 Usage Examples

### Send notification to a user:

```typescript
import { sendPushNotificationToUsers } from '@/utils/notifications';
import { supabase } from '@/lib/supabase';

const { data: { session } } = await supabase.auth.getSession();

await sendPushNotificationToUsers(
  session.access_token,
  'user-id-here',
  'Hello!',
  'This is a test notification'
);
```

### Send task reminders:

```typescript
import { triggerTaskReminders } from '@/utils/notifications';
import { supabase } from '@/lib/supabase';

const { data: { session } } = await supabase.auth.getSession();

await triggerTaskReminders(session.access_token);
```

## 🔧 Troubleshooting

**"EXPO_ACCESS_TOKEN not configured"**
→ Add the token to Supabase environment variables (Step 2)

**"No push tokens found"**
→ User needs to register for notifications in Profile screen

**"Must use physical device"**
→ Push notifications don't work in simulators

## 📚 Full Documentation

See `SUPABASE_PUSH_NOTIFICATIONS_GUIDE.md` for complete setup and API reference.

## 🎯 Next Steps

1. Set up automated task reminders (cron job)
2. Implement admin panel for sending notifications
3. Add notification preferences for users
