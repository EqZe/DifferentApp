
# Supabase Push Notifications - Complete Setup Guide

## Overview

This guide explains how to set up and use push notifications with Supabase Edge Functions in the Different app.

## Architecture

```
┌─────────────────┐
│   Mobile App    │
│  (Expo/React    │
│    Native)      │
└────────┬────────┘
         │
         │ 1. Register for push notifications
         │    Get Expo Push Token
         │
         ▼
┌─────────────────┐
│    Supabase     │
│    Database     │
│  users.push_    │
│     token       │
└────────┬────────┘
         │
         │ 2. Send notification request
         │    (with user JWT)
         │
         ▼
┌─────────────────┐
│   Supabase      │
│  Edge Function  │
│ send-push-      │
│  notification   │
└────────┬────────┘
         │
         │ 3. Forward to Expo
         │    (with EXPO_ACCESS_TOKEN)
         │
         ▼
┌─────────────────┐
│  Expo Push      │
│  Notification   │
│    Service      │
└────────┬────────┘
         │
         │ 4. Deliver notification
         │
         ▼
┌─────────────────┐
│  User's Device  │
│  (Push Token)   │
└─────────────────┘
```

## Prerequisites

1. **Expo Account**: Create an account at https://expo.dev
2. **Expo Access Token**: Generate from https://expo.dev/accounts/[username]/settings/access-tokens
3. **Supabase Project**: Already set up (pgrcmurwamszgjsdbgtq)
4. **Physical Device**: Push notifications don't work in simulators

## Step 1: Get Expo Access Token

1. Go to https://expo.dev/accounts/[your-username]/settings/access-tokens
2. Click "Create Token"
3. Name it "Push Notifications"
4. Select permissions: **Push Notifications** (at minimum)
5. Copy the token (starts with `expo_...` or similar)

## Step 2: Configure Supabase Environment Variables

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/pgrcmurwamszgjsdbgtq
2. Navigate to **Settings** → **Edge Functions** → **Environment Variables**
3. Add a new secret:
   - **Name**: `EXPO_ACCESS_TOKEN`
   - **Value**: Your Expo access token from Step 1
4. Click **Save**

## Step 3: Verify Edge Functions are Deployed

The following Edge Functions should already be deployed:

### 1. send-push-notification
- **URL**: `https://pgrcmurwamszgjsdbgtq.supabase.co/functions/v1/send-push-notification`
- **Purpose**: Send push notifications to specific tokens or user IDs
- **Authentication**: Required (JWT)

### 2. send-task-reminders
- **URL**: `https://pgrcmurwamszgjsdbgtq.supabase.co/functions/v1/send-task-reminders`
- **Purpose**: Automatically send task reminders for tasks due in 7, 3, or 1 day
- **Authentication**: Not required (for cron jobs)

To verify deployment:
1. Go to Supabase Dashboard → Edge Functions
2. Check that both functions show as "Active"

## Step 4: Test Push Notifications

### A. Register for Push Notifications

1. Open the app on a **physical device** (not simulator)
2. Log in to your account
3. Go to **Profile** screen
4. Tap "הירשם להתראות" (Register for Notifications)
5. Grant notification permissions when prompted
6. Wait for success message

### B. Test Local Notification (Development Only)

1. In Profile screen, tap "שלח התראת בדיקה מקומית"
2. You should receive 3 notifications:
   - 7-day reminder (immediate)
   - 3-day reminder (after 2 seconds)
   - 1-day reminder (after 4 seconds)

### C. Test Supabase Notification (Development Only)

1. In Profile screen, tap "שלח התראה דרך Supabase"
2. This sends a notification via Supabase Edge Function
3. Check that you receive the notification
4. If it fails, check Edge Function logs in Supabase Dashboard

## Step 5: Send Notifications from Code

### Send to Specific User IDs

```typescript
import { sendPushNotificationToUsers } from '@/utils/notifications';
import { supabase } from '@/lib/supabase';

// Get current session
const { data: { session } } = await supabase.auth.getSession();

if (session?.access_token) {
  const success = await sendPushNotificationToUsers(
    session.access_token,
    'user-uuid-here', // or array of user IDs
    '🎉 Notification Title',
    'This is the notification body',
    { customData: 'value' }, // optional
    { priority: 'high' } // optional
  );
  
  if (success) {
    console.log('Notification sent successfully!');
  }
}
```

### Send to Specific Expo Push Tokens

```typescript
import { sendPushNotificationToTokens } from '@/utils/notifications';
import { supabase } from '@/lib/supabase';

const { data: { session } } = await supabase.auth.getSession();

if (session?.access_token) {
  const success = await sendPushNotificationToTokens(
    session.access_token,
    'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    'Notification Title',
    'Notification Body'
  );
}
```

### Trigger Task Reminders

```typescript
import { triggerTaskReminders } from '@/utils/notifications';
import { supabase } from '@/lib/supabase';

const { data: { session } } = await supabase.auth.getSession();

if (session?.access_token) {
  const success = await triggerTaskReminders(session.access_token);
  console.log('Task reminders triggered:', success);
}
```

## Step 6: Set Up Automated Task Reminders (Optional)

### Option A: Supabase Cron Job

1. Go to Supabase Dashboard → Database → Extensions
2. Enable `pg_cron` extension if not already enabled
3. Run this SQL in the SQL Editor:

```sql
-- Schedule task reminders to run daily at 9:00 AM
SELECT cron.schedule(
  'send-daily-task-reminders',
  '0 9 * * *', -- Every day at 9:00 AM
  $$
  SELECT
    net.http_post(
      url:='https://pgrcmurwamszgjsdbgtq.supabase.co/functions/v1/send-task-reminders',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### Option B: External Cron Service

Use GitHub Actions, Vercel Cron, or Render Cron to call the Edge Function:

```yaml
# .github/workflows/task-reminders.yml
name: Send Task Reminders
on:
  schedule:
    - cron: '0 9 * * *' # Every day at 9:00 AM UTC

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Task Reminders
        run: |
          curl -X POST \
            https://pgrcmurwamszgjsdbgtq.supabase.co/functions/v1/send-task-reminders \
            -H "Content-Type: application/json" \
            -d '{}'
```

## Step 7: Monitor and Debug

### View Edge Function Logs

1. Go to Supabase Dashboard → Edge Functions
2. Click on the function name
3. View **Logs** tab
4. Filter by time range and log level

### Common Issues

#### "EXPO_ACCESS_TOKEN not configured"
- **Solution**: Add `EXPO_ACCESS_TOKEN` to Supabase environment variables (Step 2)

#### "No push tokens found for the specified users"
- **Solution**: User hasn't registered for push notifications. They need to tap "הירשם להתראות" in Profile screen

#### "Failed to send push notification"
- **Possible causes**:
  - Invalid Expo access token
  - Expo push token expired or invalid
  - Network connectivity issues
  - Expo push service down (check https://status.expo.dev)

#### "Must use physical device"
- **Solution**: Push notifications don't work in simulators. Test on a real iOS or Android device

### Debug Checklist

- [ ] EXPO_ACCESS_TOKEN is set in Supabase environment variables
- [ ] Edge Functions are deployed and active
- [ ] User has registered for push notifications (push_token exists in database)
- [ ] Testing on a physical device (not simulator)
- [ ] User granted notification permissions
- [ ] Network connectivity is working
- [ ] Expo push service is operational (https://status.expo.dev)

## API Reference

### sendPushNotificationToUsers

Send push notification to specific user IDs.

```typescript
sendPushNotificationToUsers(
  accessToken: string,      // Supabase JWT token
  userIds: string | string[], // User ID(s)
  title: string,             // Notification title
  body: string,              // Notification body
  data?: Record<string, any>, // Optional custom data
  options?: {
    sound?: string;          // Default: 'default'
    badge?: number;          // Badge count
    priority?: 'default' | 'normal' | 'high'; // Default: 'high'
    channelId?: string;      // Default: 'default'
  }
): Promise<boolean>
```

### sendPushNotificationToTokens

Send push notification to specific Expo push tokens.

```typescript
sendPushNotificationToTokens(
  accessToken: string,
  tokens: string | string[],
  title: string,
  body: string,
  data?: Record<string, any>,
  options?: {
    sound?: string;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
    channelId?: string;
  }
): Promise<boolean>
```

### triggerTaskReminders

Trigger the task reminders Edge Function.

```typescript
triggerTaskReminders(
  accessToken: string
): Promise<boolean>
```

## Database Schema

The `users` table includes a `push_token` column:

```sql
CREATE TABLE users (
  auth_user_id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  has_contract BOOLEAN DEFAULT FALSE,
  travel_date DATE,
  push_token TEXT, -- Expo push token
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Best Practices

1. **Never expose Expo access token** in client-side code
2. **Always validate JWT tokens** in Edge Functions
3. **Rate limit** notification sending to prevent spam
4. **Validate user permissions** before sending notifications
5. **Store push tokens securely** in the database
6. **Use HTTPS** for all API calls
7. **Implement opt-out** mechanism for users who don't want notifications

## Production Checklist

- [ ] EXPO_ACCESS_TOKEN configured in Supabase
- [ ] Edge Functions deployed and tested
- [ ] Cron job set up for automated task reminders
- [ ] Notification permissions requested from users
- [ ] Push tokens saved to database
- [ ] Error handling implemented
- [ ] Logging and monitoring set up
- [ ] Rate limiting implemented
- [ ] User opt-out mechanism available

## Resources

- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Expo Push Notification Tool](https://expo.dev/notifications) - Test notifications
- [Expo Status](https://status.expo.dev) - Check service status

## Support

If you encounter issues:

1. Check Edge Function logs in Supabase Dashboard
2. Check console logs in the mobile app
3. Verify all environment variables are set
4. Test on a physical device
5. Check Expo service status

## Next Steps

1. ✅ Set up EXPO_ACCESS_TOKEN in Supabase
2. ✅ Test notifications on physical device
3. ⏳ Set up automated task reminders (cron job)
4. ⏳ Implement admin panel for sending custom notifications
5. ⏳ Add notification history/logs
6. ⏳ Implement user notification preferences
