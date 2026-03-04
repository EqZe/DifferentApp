
# Automatic Push Notifications System

This document explains the automatic push notification system that sends notifications to users when specific database events occur.

## Overview

The system uses **Supabase Database Triggers** + **Edge Functions** + **OneSignal** to automatically send push notifications when:

1. **Container Updates** - When a record in `user_containers` is created or updated
2. **Task Approved** - When a task status changes from `PENDING` → `DONE`
3. **Schedule Updates** - When a user's schedule is modified

## Architecture

```
Database Change → Trigger → Edge Function → OneSignal → User's Device
```

### Components

1. **Database Triggers** (PostgreSQL)
   - `trigger_container_update` - Monitors `user_containers` table
   - `trigger_task_approved` - Monitors `user_tasks` table for status changes
   - `trigger_schedule_update` - Monitors `users` table for schedule changes

2. **Edge Functions** (Deno/TypeScript)
   - `send-container-update-notification`
   - `send-task-approved-notification`
   - `send-schedule-update-notification`

3. **OneSignal Integration**
   - Sends push notifications to users via their external user ID (auth_user_id)
   - Supports both English and Hebrew messages

## Notification Details

### 1. Container Update Notification

**Trigger:** When any field in `user_containers` is updated or a new container is created

**Message:**
- **English:** "New update regarding your container ({container_id})"
- **Hebrew:** "עדכון חדש בנוגע למכולה שלך ({container_id})"

**Data Payload:**
```json
{
  "type": "container_update",
  "container_id": "...",
  "user_id": "..."
}
```

### 2. Task Approved Notification

**Trigger:** When a task status changes from `PENDING` to `DONE`

**Message:**
- **English:** "Representative approved your task: {task_description}"
- **Hebrew:** "נציג אישר את המשימה שביצעת: {task_description}"

**Data Payload:**
```json
{
  "type": "task_approved",
  "task_id": "...",
  "task_description": "...",
  "user_id": "..."
}
```

### 3. Schedule Update Notification

**Trigger:** When the `schedule` field in the `users` table is modified

**Message:**
- **English:** "Your schedule has been updated, please review it again"
- **Hebrew:** "חל עדכון בלוח הזמנים שלך, יש לעיין מחדש"

**Data Payload:**
```json
{
  "type": "schedule_update",
  "user_id": "..."
}
```

## Configuration

### OneSignal Setup

The Edge Functions require the following environment variables to be set in Supabase:

1. **ONESIGNAL_APP_ID** (default: `b732b467-6886-4c7b-b3d9-5010de1199d6`)
2. **ONESIGNAL_REST_API_KEY** (required - get from OneSignal dashboard)

To set these in Supabase:
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings**
3. Add the environment variables

### User Identification

The system uses **External User IDs** to target specific users:
- When a user logs in, their `auth_user_id` is set as the OneSignal External User ID
- This is handled automatically by the `OneSignalContext` in the frontend
- Notifications are sent to users via `include_external_user_ids: [userId]`

## Testing

### Test Container Update
```sql
-- Update a container to trigger notification
UPDATE user_containers 
SET items_ready = NOW() 
WHERE auth_user_id = 'YOUR_USER_ID';
```

### Test Task Approval
```sql
-- Change task status from PENDING to DONE
UPDATE user_tasks 
SET status = 'DONE' 
WHERE auth_user_id = 'YOUR_USER_ID' 
AND status = 'PENDING' 
LIMIT 1;
```

### Test Schedule Update
```sql
-- Update user schedule
UPDATE users 
SET schedule = '{"days": {"2025-02-01": {"events": {}}}}'::jsonb 
WHERE auth_user_id = 'YOUR_USER_ID';
```

## Monitoring

### Check Edge Function Logs

1. Go to Supabase Dashboard → **Edge Functions**
2. Select the function you want to monitor
3. View logs to see:
   - Incoming webhook payloads
   - OneSignal API responses
   - Any errors

### Check Database Trigger Execution

```sql
-- View pg_net request history
SELECT * FROM net._http_response 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### Notifications Not Sending

1. **Check OneSignal Configuration**
   - Verify `ONESIGNAL_REST_API_KEY` is set correctly
   - Ensure the user has granted notification permissions
   - Verify the user's External User ID is set in OneSignal

2. **Check Edge Function Logs**
   - Look for errors in the Edge Function execution
   - Verify the webhook is being called by the trigger

3. **Check Database Triggers**
   - Ensure triggers are enabled: `SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_%';`
   - Check pg_net is working: `SELECT net.http_post(...)`

### User Not Receiving Notifications

1. **Verify User Registration**
   - Check that the user has registered for push notifications
   - Verify their External User ID is set: Check OneSignal dashboard

2. **Check Notification Preferences**
   - User may have disabled notifications in app settings
   - Check device notification settings

3. **Test with OneSignal Dashboard**
   - Send a test notification directly from OneSignal
   - If this works, the issue is with the Edge Function or trigger

## Security

- Edge Functions use `verify_jwt: false` because they're called by database triggers (not user requests)
- Database functions use `SECURITY DEFINER` to ensure they have permission to call pg_net
- OneSignal REST API Key is stored securely in Supabase environment variables
- User targeting is based on `auth_user_id` which is validated by Supabase Auth

## Future Enhancements

Possible improvements:
- Add notification preferences (allow users to opt-out of specific notification types)
- Add notification history/inbox in the app
- Support for notification actions (e.g., "View Container", "View Task")
- Rich notifications with images
- Scheduled notifications (e.g., task reminders)
