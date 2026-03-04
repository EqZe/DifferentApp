
# Push Notification Testing Guide

This guide explains how to test the automatic push notifications system.

## Prerequisites

1. **OneSignal Configuration**
   - Ensure `ONESIGNAL_REST_API_KEY` is set in Supabase Edge Functions settings
   - Get this from: OneSignal Dashboard → Settings → Keys & IDs → REST API Key

2. **User Setup**
   - User must be logged into the app
   - User must have granted notification permissions
   - User's `auth_user_id` must be set as External User ID in OneSignal (this happens automatically on login)

## Testing Methods

### Method 1: Using Supabase SQL Editor

Go to your Supabase project → SQL Editor and run these queries:

#### Test Container Update Notification

```sql
-- Replace 'YOUR_USER_ID' with an actual auth_user_id from the users table
UPDATE user_containers 
SET items_ready = NOW() 
WHERE auth_user_id = 'YOUR_USER_ID'
LIMIT 1;
```

Expected notification:
- **Hebrew:** "עדכון חדש בנוגע למכולה שלך (container_id)"
- **English:** "New update regarding your container (container_id)"

#### Test Task Approved Notification

```sql
-- First, set a task to PENDING status
UPDATE user_tasks 
SET status = 'PENDING' 
WHERE auth_user_id = 'YOUR_USER_ID' 
AND status = 'YET'
LIMIT 1;

-- Then, approve it (change to DONE) - this triggers the notification
UPDATE user_tasks 
SET status = 'DONE' 
WHERE auth_user_id = 'YOUR_USER_ID' 
AND status = 'PENDING'
LIMIT 1;
```

Expected notification:
- **Hebrew:** "נציג אישר את המשימה שביצעת: {task_description}"
- **English:** "Representative approved your task: {task_description}"

#### Test Schedule Update Notification

```sql
-- Update the user's schedule
UPDATE users 
SET schedule = jsonb_set(
  COALESCE(schedule, '{}'::jsonb),
  '{days,2025-02-15}',
  '{"date": "2025-02-15", "events": {"morning": {"description_he": "פגישה", "description_en": "Meeting", "time": "09:00"}}}'::jsonb
)
WHERE auth_user_id = 'YOUR_USER_ID';
```

Expected notification:
- **Hebrew:** "חל עדכון בלוח הזמנים שלך, יש לעיין מחדש"
- **English:** "Your schedule has been updated, please review it again"

### Method 2: Using the App

#### Container Update
1. Admin updates a container status in the database
2. User receives notification immediately

#### Task Approval
1. User marks a task as "In Progress" (PENDING status)
2. Admin approves the task (changes status to DONE)
3. User receives notification

#### Schedule Update
1. Admin updates the user's travel schedule
2. User receives notification

## Verifying Notifications Were Sent

### Check Edge Function Logs

1. Go to Supabase Dashboard → **Edge Functions**
2. Select one of these functions:
   - `send-container-update-notification`
   - `send-task-approved-notification`
   - `send-schedule-update-notification`
3. Click **Logs** tab
4. Look for:
   - "Container update webhook received"
   - "Task update webhook received"
   - "Schedule update webhook received"
   - "OneSignal response: {success: true}"

### Check OneSignal Dashboard

1. Go to OneSignal Dashboard → **Delivery**
2. You should see the sent notifications
3. Check delivery status (Sent, Delivered, Clicked)

### Check pg_net Requests

```sql
-- View recent HTTP requests made by pg_net
SELECT 
  id,
  url,
  status_code,
  content,
  created_at
FROM net._http_response 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting

### No Notification Received

1. **Check User's External User ID**
   ```sql
   -- Get user's auth_user_id
   SELECT auth_user_id, full_name, email FROM users WHERE email = 'user@example.com';
   ```
   - Go to OneSignal Dashboard → **Audience** → **All Users**
   - Search for the External User ID
   - If not found, user needs to log out and log back in

2. **Check Edge Function Logs**
   - Look for errors in the Edge Function execution
   - Common issues:
     - "ONESIGNAL_REST_API_KEY not configured"
     - "Missing userId or containerId"
     - OneSignal API errors

3. **Check Notification Permissions**
   - User must grant notification permissions in the app
   - Check device settings → App → Notifications

4. **Test with OneSignal Dashboard**
   - Send a test notification directly from OneSignal
   - If this works, the issue is with the Edge Function or trigger

### Notification Sent But Not Displayed

1. **Check Device Settings**
   - Ensure notifications are enabled for the app
   - Check Do Not Disturb mode

2. **Check Notification Preferences**
   - User may have disabled specific notification types in app settings

3. **Check OneSignal Delivery Status**
   - Go to OneSignal Dashboard → **Delivery**
   - Check if notification was delivered or failed

## Getting User IDs for Testing

```sql
-- Get all users with their auth_user_id
SELECT 
  auth_user_id,
  full_name,
  email,
  phone_number,
  has_contract
FROM users
ORDER BY created_at DESC;

-- Get users with containers
SELECT DISTINCT
  u.auth_user_id,
  u.full_name,
  u.email,
  COUNT(uc.id) as container_count
FROM users u
JOIN user_containers uc ON uc.auth_user_id = u.auth_user_id
GROUP BY u.auth_user_id, u.full_name, u.email;

-- Get users with tasks
SELECT DISTINCT
  u.auth_user_id,
  u.full_name,
  u.email,
  COUNT(ut.id) as task_count
FROM users u
JOIN user_tasks ut ON ut.auth_user_id = u.auth_user_id
GROUP BY u.auth_user_id, u.full_name, u.email;
```

## Important Notes

1. **Notification Language**
   - Notifications are sent in both Hebrew and English
   - OneSignal will display the appropriate language based on device settings

2. **Notification Timing**
   - Notifications are sent immediately when the database change occurs
   - There may be a 1-2 second delay for processing

3. **Rate Limiting**
   - OneSignal has rate limits on the free tier
   - If testing extensively, be aware of these limits

4. **Production vs Development**
   - Use the same OneSignal App ID for both environments
   - Consider using different External User ID prefixes for dev/prod if needed

## Next Steps

After testing, you can:
1. Add notification preferences to allow users to opt-out of specific types
2. Add notification history/inbox in the app
3. Add notification actions (e.g., "View Container", "View Task")
4. Implement rich notifications with images
5. Add scheduled notifications (e.g., task reminders before due date)
