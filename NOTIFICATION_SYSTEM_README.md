
# Push Notification Reminder System

## Overview
This document describes the push notification reminder system for task reminders. The system sends notifications **10 days (1 week + 3 days) before a task's due date at 19:00** if the task is not yet completed.

## Architecture

### Frontend Components

#### 1. Notification Utility (`utils/notifications.ts`)
- **Purpose**: Handles push notification registration and permissions
- **Key Functions**:
  - `registerForPushNotificationsAsync()`: Requests permissions and obtains Expo push token
  - `scheduleLocalNotification()`: For testing local notifications
  - `cancelAllNotifications()`: Cleanup utility

#### 2. User Context Integration (`contexts/UserContext.tsx`)
- **When**: Automatically registers push token after successful login
- **Flow**:
  1. User logs in successfully
  2. `loadUserProfile()` is called
  3. `registerPushToken()` is triggered
  4. Push token is obtained and ready to be sent to backend

#### 3. App Configuration (`app.json`)
- **Added**:
  - `expo-notifications` plugin with icon and color configuration
  - Android notification permissions
  - EAS project ID placeholder (needs to be filled with actual project ID)

### Backend Components (TODO: Backend Integration Required)

#### 1. Database Schema Changes
**Table**: `users`
- Add column: `push_token` (text, nullable)
- Stores the Expo push notification token for each user

#### 2. API Endpoints

**POST /api/users/:userId/push-token**
- **Purpose**: Save/update user's push notification token
- **Request Body**:
  ```json
  {
    "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }
  ```
- **Response**: `{ success: true }`
- **Security**: Verify userId matches authenticated user

#### 3. Scheduled Job / Cron
**Frequency**: Runs daily at 19:00 (Israel timezone)

**Logic**:
```
1. Calculate target date: TODAY + 10 days
2. Query all tasks where:
   - due_date = target date
   - status != 'DONE'
   - user has push_token
3. Group tasks by user_id
4. For each user:
   - If 1 task: Send "לקראת נסיעתך לסין יש לבצע: [Task Title]"
   - If 2+ tasks: Send "נשארו מספר משימות לביצוע לקראת נסיעתך לסין"
5. Send push notifications via Expo Push API
```

**Expo Push Notification Format**:
```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
  "sound": "default",
  "title": "תזכורת משימה",
  "body": "לקראת נסיעתך לסין יש לבצע: [Task Title]",
  "data": {
    "taskId": "uuid",
    "screen": "tasks"
  },
  "priority": "high",
  "channelId": "default"
}
```

## Notification Messages (Hebrew)

### Single Task Reminder
```
Title: תזכורת משימה
Body: לקראת נסיעתך לסין יש לבצע: [Task Title]
```

### Multiple Tasks Reminder
```
Title: תזכורת משימות
Body: נשארו מספר משימות לביצוע לקראת נסיעתך לסין
```

## Implementation Status

### ✅ Completed (Frontend)
- [x] Installed `expo-notifications` and `expo-device` packages
- [x] Created notification utility with permission handling
- [x] Integrated push token registration in UserContext
- [x] Configured app.json with notification settings
- [x] Added Android notification permissions

### ⏳ Pending (Backend Integration)
- [ ] Add `push_token` column to `users` table
- [ ] Create POST /api/users/:userId/push-token endpoint
- [ ] Implement daily cron job (19:00 Israel time)
- [ ] Integrate Expo Push Notification API
- [ ] Add notification sending logic with Hebrew messages
- [ ] Handle notification grouping (single vs multiple tasks)

## Testing

### Local Notification Test
You can test notifications locally using the utility function:

```typescript
import { scheduleLocalNotification } from '@/utils/notifications';

// Schedule a test notification in 5 seconds
await scheduleLocalNotification(
  'תזכורת משימה',
  'לקראת נסיעתך לסין יש לבצע: בדיקת דרכון',
  5
);
```

### Production Testing Checklist
1. **Physical Device Required**: Push notifications don't work on simulators
2. **Permission Grant**: User must grant notification permissions
3. **Token Registration**: Verify push token is saved to backend
4. **Cron Job**: Verify scheduled job runs at 19:00
5. **Message Content**: Verify Hebrew text displays correctly
6. **Task Filtering**: Verify only incomplete tasks trigger notifications
7. **Date Calculation**: Verify 10-day advance calculation is correct

## Security Considerations

1. **Token Privacy**: Push tokens are sensitive - store securely
2. **User Verification**: Always verify userId matches authenticated user
3. **Rate Limiting**: Implement rate limiting on token registration endpoint
4. **Token Expiry**: Handle expired/invalid tokens gracefully

## Dependencies

### Frontend
- `expo-notifications`: ^0.32.16
- `expo-device`: ^8.0.10
- `expo-constants`: For accessing app configuration

### Backend (Required)
- Expo Push Notification Service
- Cron job scheduler (node-cron, bull, or similar)
- Date/time library with timezone support

## Configuration

### Required Environment Variables (Backend)
```env
EXPO_ACCESS_TOKEN=your_expo_access_token_here
TIMEZONE=Asia/Jerusalem
NOTIFICATION_TIME=19:00
NOTIFICATION_ADVANCE_DAYS=10
```

## Future Enhancements

1. **Notification Preferences**: Allow users to enable/disable reminders
2. **Custom Timing**: Let users choose notification time
3. **Multiple Reminders**: Send reminders at 10 days, 3 days, and 1 day before
4. **Rich Notifications**: Add action buttons (Mark as Done, Snooze)
5. **Notification History**: Track sent notifications in database
6. **Analytics**: Monitor notification delivery and open rates

## Troubleshooting

### Push Token Not Obtained
- **Cause**: Running on simulator or permissions denied
- **Solution**: Test on physical device and ensure permissions are granted

### Notifications Not Received
- **Cause**: Invalid token, expired token, or backend not sending
- **Solution**: Check backend logs, verify token is valid, test with Expo Push Tool

### Hebrew Text Not Displaying
- **Cause**: Encoding issues
- **Solution**: Ensure UTF-8 encoding in notification payload

## References

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Expo Push Notification Tool](https://expo.dev/notifications)
