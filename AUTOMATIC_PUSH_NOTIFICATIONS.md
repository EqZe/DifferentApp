
# Automatic Push Notifications System

## Overview

This document describes the automatic push notification system that sends notifications to users when specific database records are updated. The system uses Supabase database triggers to automatically detect changes and send push notifications without requiring the user to be active in the app.

## Notification Types

The system automatically sends push notifications for the following events:

### 1. Container Updates
**Trigger:** When any field in the `user_containers` table is updated
**Message:** `"עדכון חדש בנוגע למכולה שלך: (container_id)"`
**English:** "New update regarding your container: (container_id)"

**Monitored Fields:**
- `items_ready`
- `items_paid`
- `items_in_garage`
- `items_on_container`
- `container_sent`
- `container_arrive`

**Data Payload:**
```json
{
  "type": "container_update",
  "container_id": "container_id_per_user",
  "container_uuid": "uuid"
}
```

### 2. Task Approval
**Trigger:** When a task status changes from `PENDING` to `DONE` in the `user_tasks` table
**Message:** `"נציג אישר את המשימה שביצעת: (task description)"`
**English:** "Representative approved the task you completed: (task description)"

**Data Payload:**
```json
{
  "type": "task_approved",
  "task_id": "task_uuid",
  "task_description": "description from tasks_metadata"
}
```

### 3. Schedule Updates
**Trigger:** When the `schedule` field in the `users` table is updated
**Message:** `"חל עדכון בלוז שלך, יש לעיין מחדש"`
**English:** "Your schedule has been updated, please review"

**Data Payload:**
```json
{
  "type": "schedule_update"
}
```

## Technical Architecture

### Database Layer

#### 1. Core Function: `notify_user_via_push`
This function is responsible for sending push notifications via the Supabase Edge Function.

```sql
CREATE OR REPLACE FUNCTION notify_user_via_push(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
```

**How it works:**
1. Fetches the user's `push_token` from the `users` table
2. Only proceeds if the user has a valid push token
3. Calls the `send-push-notification` Edge Function via `pg_net.http_post`
4. Logs the notification attempt
5. Handles errors gracefully without failing the transaction

#### 2. Database Triggers

**Container Update Trigger:**
```sql
CREATE TRIGGER on_container_update_notify
  AFTER UPDATE ON user_containers
  FOR EACH ROW
  EXECUTE FUNCTION trigger_container_update_notification();
```

**Task Approval Trigger:**
```sql
CREATE TRIGGER on_task_approved_notify
  AFTER UPDATE ON user_tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_task_approved_notification();
```

**Schedule Update Trigger:**
```sql
CREATE TRIGGER on_schedule_update_notify
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_schedule_update_notification();
```

### Edge Function Layer

The `send-push-notification` Edge Function handles three modes of operation:

1. **Single Token Mode** (from DB triggers):
   - Receives a single `token` parameter
   - Sends notification directly to that token

2. **User IDs Mode**:
   - Receives `userId` or array of user IDs
   - Fetches push tokens from database
   - Sends notifications to all found tokens

3. **Direct Tokens Mode**:
   - Receives `to` parameter with token(s)
   - Sends notifications directly

**Authentication:**
- Internal calls from database triggers use `INTERNAL_DB_TRIGGER` marker
- External calls require valid JWT authentication
- Service role key is accepted for internal operations

### Frontend Layer

#### Notification Handling

The app handles incoming notifications in `app/_layout.tsx`:

```typescript
// Listener for notifications received while app is in foreground
notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
  console.log('🔔 Notification received in foreground:', notification);
  const data = notification.request.content.data;
  
  if (data?.type) {
    console.log('🔔 Notification type:', data.type);
  }
});

// Listener for when user taps on a notification
responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  console.log('🔔 User tapped notification:', response);
  const data = response.notification.request.content.data;
  
  // Handle different notification types
  if (data?.type === 'container_update') {
    router.push('/(tabs)/containers');
  } else if (data?.type === 'task_approved') {
    router.push('/(tabs)/tasks');
  } else if (data?.type === 'schedule_update') {
    router.push('/(tabs)/schedule');
  }
});
```

## Setup Requirements

### 1. Database Extensions

The system requires the `pg_net` extension for making HTTP requests from database triggers:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Environment Variables

The Edge Function requires the following environment variables:

- `EXPO_ACCESS_TOKEN`: Token for sending push notifications via Expo's service
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for internal operations
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Anon key for client operations

### 3. User Push Token Registration

Users must register for push notifications to receive them. This is handled in the Profile screen:

```typescript
const token = await registerForPushNotificationsAsync();
if (token && session?.user?.id) {
  await api.savePushToken(session.user.id, token);
  await refreshUser();
}
```

## Testing

### Manual Testing

You can test the notification system by manually updating records in the database:

**Test Container Update:**
```sql
UPDATE user_containers
SET items_ready = NOW()
WHERE auth_user_id = 'user-uuid';
```

**Test Task Approval:**
```sql
UPDATE user_tasks
SET status = 'DONE'
WHERE id = 'task-uuid' AND status = 'PENDING';
```

**Test Schedule Update:**
```sql
UPDATE users
SET schedule = '{"days": {...}}'::jsonb
WHERE auth_user_id = 'user-uuid';
```

### Debugging

**Check if notifications are being sent:**
1. Look for database logs: `RAISE NOTICE` statements in the trigger functions
2. Check Edge Function logs in Supabase Dashboard
3. Check frontend logs for notification receipt

**Common Issues:**
- User doesn't have a `push_token` → User needs to register for notifications
- `pg_net` extension not enabled → Run `CREATE EXTENSION IF NOT EXISTS pg_net;`
- Edge Function not responding → Check Edge Function logs and environment variables
- Notifications not appearing → Check device notification permissions

## Security Considerations

1. **SECURITY DEFINER**: All trigger functions use `SECURITY DEFINER` to run with elevated privileges
2. **Token Validation**: Only users with valid push tokens receive notifications
3. **Error Handling**: Errors in notification sending don't fail the database transaction
4. **Authentication**: Edge Function validates internal calls vs external calls
5. **RLS Policies**: Ensure Row Level Security policies are properly configured on all tables

## Performance Considerations

1. **Async Execution**: Notifications are sent asynchronously via `pg_net`
2. **Non-Blocking**: Failed notifications don't block database operations
3. **Selective Triggers**: Triggers only fire when relevant fields change
4. **Batch Operations**: For bulk updates, consider disabling triggers temporarily

## Future Enhancements

Potential improvements to the notification system:

1. **Notification Preferences**: Allow users to customize which notifications they receive
2. **Quiet Hours**: Respect user's quiet hours settings
3. **Notification History**: Store notification history in database
4. **Rich Notifications**: Add images, actions, and rich content to notifications
5. **Localization**: Send notifications in user's preferred language
6. **Delivery Tracking**: Track notification delivery and read status
7. **Retry Logic**: Implement retry mechanism for failed notifications

## Monitoring

To monitor the notification system:

1. **Database Logs**: Check PostgreSQL logs for trigger execution
2. **Edge Function Logs**: Monitor Edge Function invocations and errors
3. **Expo Push Service**: Check Expo's push notification dashboard for delivery status
4. **User Feedback**: Monitor user reports of missing notifications

## Troubleshooting

### Notifications Not Sending

1. Check if user has a push token:
   ```sql
   SELECT push_token FROM users WHERE auth_user_id = 'user-uuid';
   ```

2. Check if triggers are enabled:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%notify%';
   ```

3. Check Edge Function logs in Supabase Dashboard

4. Verify `pg_net` extension is installed:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

### Notifications Delayed

1. Check `pg_net` queue:
   ```sql
   SELECT * FROM net.http_request_queue;
   ```

2. Monitor Edge Function response times

3. Check Expo push service status

## Conclusion

The automatic push notification system provides real-time updates to users without requiring them to be active in the app. The system is robust, scalable, and handles errors gracefully to ensure database operations are never blocked by notification failures.

For questions or issues, refer to the Supabase documentation on database triggers and Edge Functions, or the Expo documentation on push notifications.
