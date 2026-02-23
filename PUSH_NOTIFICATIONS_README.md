
# Push Notifications System

This document explains the push notification system implemented in the app.

## Overview

The app sends push notifications for three key events:
1. **Container Updates** - When any field in a user's container record changes
2. **Task Approval** - When a task status changes from PENDING to DONE
3. **Schedule Updates** - When a user's schedule is modified

## Architecture

### Frontend (React Native + Expo)

**Files:**
- `utils/notifications.ts` - Push notification registration and local notification helpers
- `contexts/UserContext.tsx` - Automatically registers push tokens on login

**Flow:**
1. User logs in
2. `UserContext` calls `registerForPushNotificationsAsync()`
3. Expo push token is obtained and saved to the database via `api.savePushToken()`
4. Token is stored in the `users.push_token` column

### Backend (Supabase)

**Components:**
1. **Edge Function** (`send-push-notification`)
   - Receives notification requests from database triggers
   - Fetches user's push token from database
   - Sends notification via Expo Push API

2. **Database Triggers**
   - `container_update_notification` - Fires on `user_containers` UPDATE
   - `task_approved_notification` - Fires on `user_tasks` UPDATE (PENDING → DONE)
   - `schedule_update_notification` - Fires on `users` UPDATE (schedule field)

3. **Helper Function** (`notify_push`)
   - Called by triggers to send HTTP request to Edge Function
   - Uses `pg_net` extension for async HTTP calls

## Notification Messages

### 1. Container Update
**Trigger:** Any change to container step fields (items_ready, items_paid, etc.)

**Message:**
- Title: `עדכון מכולה`
- Body: `עדכון חדש בנוגע למכולה שלך: {container_id_per_user}`

**Data:**
```json
{
  "type": "container_update",
  "container_id": "container_id_per_user",
  "container_db_id": "uuid"
}
```

### 2. Task Approved
**Trigger:** Task status changes from PENDING to DONE

**Message:**
- Title: `משימה אושרה`
- Body: `נציג אישר את המשימה שביצעת: {task_description}`

**Data:**
```json
{
  "type": "task_approved",
  "task_id": "uuid",
  "task_description": "description text"
}
```

### 3. Schedule Update
**Trigger:** User's schedule field is modified

**Message:**
- Title: `עדכון לוח זמנים`
- Body: `חל עדכון בלו"ז שלך, יש לעיין מחדש`

**Data:**
```json
{
  "type": "schedule_update",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## Database Schema

### users table
```sql
push_token TEXT NULL -- Expo push token (e.g., ExponentPushToken[xxx])
schedule JSONB NULL -- User's schedule data
schedule_updated_at TIMESTAMPTZ NULL -- Last schedule update timestamp
```

## Testing

### Local Notifications (Development)
Use the test button in the Profile screen to send local notifications:

```typescript
import { sendTestTaskReminders } from '@/utils/notifications';

// Sends 3 test notifications (7-day, 3-day, 1-day reminders)
await sendTestTaskReminders('Test Task Title');
```

### Testing Push Notifications
1. Build the app with EAS Build (push notifications don't work in Expo Go)
2. Install on a physical device
3. Log in to register push token
4. Update a container, task, or schedule from the admin panel
5. Notification should appear on the device

## Admin Panel Integration

To trigger notifications from the admin panel:

### Container Update
```sql
UPDATE user_containers 
SET items_ready = NOW() 
WHERE id = 'container-uuid';
-- Automatically triggers notification
```

### Task Approval
```sql
UPDATE user_tasks 
SET status = 'DONE' 
WHERE id = 'task-uuid' AND status = 'PENDING';
-- Automatically triggers notification
```

### Schedule Update
```sql
UPDATE users 
SET schedule = '{"days": {...}}' 
WHERE auth_user_id = 'user-uuid';
-- Automatically triggers notification
```

## Troubleshooting

### Push Token Not Saved
- Check console logs for "Push token saved successfully"
- Verify user is logged in
- Ensure device is physical (not simulator)

### Notifications Not Received
1. Check push token is saved in database: `SELECT push_token FROM users WHERE auth_user_id = 'xxx'`
2. Check Edge Function logs in Supabase dashboard
3. Verify triggers are enabled: `SELECT * FROM pg_trigger WHERE tgname LIKE '%notification%'`
4. Test Edge Function directly via Supabase dashboard

### Development Mode
- Push notifications require EAS Build or production build
- Expo Go does not support push notifications reliably
- Use local notifications for testing in development

## Security

- Edge Function does not require JWT verification (called by database triggers)
- Push tokens are stored securely in the database
- Only the user's own push token is used (verified by user_id)
- Database triggers run with SECURITY DEFINER (elevated privileges)

## Future Enhancements

- [ ] Add notification preferences (allow users to disable certain types)
- [ ] Implement notification history/inbox
- [ ] Add deep linking to navigate to relevant screen when notification is tapped
- [ ] Support for notification badges (unread count)
- [ ] Rich notifications with images
