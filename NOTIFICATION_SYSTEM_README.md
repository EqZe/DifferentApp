
# 🔔 Notification System Documentation

## Overview
This document describes the push notification system for task reminders in the Different app. The system sends automated reminders to users about upcoming tasks at 7 days, 3 days, and 1 day before the due date.

## Architecture

### Frontend Components

#### 1. Notification Registration (`utils/notifications.ts`)
- **Purpose**: Handle push notification permissions and token registration
- **Key Functions**:
  - `registerForPushNotificationsAsync()`: Registers device for push notifications and returns Expo push token
  - `showImmediateNotification()`: Shows a local notification immediately (for testing)
  - `sendTestTaskReminders()`: Sends all 3 types of reminder notifications for testing purposes
  - `cancelAllNotifications()`: Cancels all scheduled notifications

#### 2. User Context Integration (`contexts/UserContext.tsx`)
- Automatically registers push token when user logs in
- Saves token to backend via `api.savePushToken()`
- Non-blocking registration (uses setTimeout to avoid blocking UI)

#### 3. Profile Screen Test Button (`app/(tabs)/profile.tsx` & `profile.ios.tsx`)
- **Test Notification Button**: Sends all 3 types of reminders (7-day, 3-day, 1-day) for a random task
- Fetches user's tasks and picks a random one
- Demonstrates the notification flow with actual task data
- Shows loading state while sending notifications

### Backend Components

#### 1. Database Schema
```sql
-- Users table includes push_token column
CREATE TABLE users (
  auth_user_id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  has_contract BOOLEAN DEFAULT FALSE,
  travel_date DATE,
  push_token TEXT,  -- Expo push token for notifications
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks are stored in user_tasks with metadata
CREATE TABLE user_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT REFERENCES users(auth_user_id),
  task_metadata_id UUID REFERENCES tasks_metadata(id),
  status TEXT CHECK (status IN ('YET', 'PENDING', 'DONE')),
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Task metadata defines task templates
CREATE TABLE tasks_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  due_date_offset_days INTEGER NOT NULL,
  requires_pending BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. API Endpoints
- `POST /api/users/:id/push-token`: Save push token for a user
  - Body: `{ pushToken: string }`
  - Response: `{ success: boolean, message: string }`

#### 3. Scheduled Job (Proposed)
**⏰ Schedule: Daily at 9:00 AM (Israel Time)**

The backend should implement a daily cron job that:

1. **Runs at 9:00 AM Israel Time** (changed from 19:00)
2. Queries all users with active tasks
3. For each user, checks tasks due in 7, 3, or 1 day
4. Sends appropriate notifications via Expo Push Notification API

**Pseudo-code:**
```javascript
// Run daily at 9:00 AM Israel Time
cron.schedule('0 9 * * *', async () => {
  console.log('Running daily task reminder job at 9:00 AM');
  
  // Get all users with push tokens
  const users = await db.query(`
    SELECT auth_user_id, push_token, full_name
    FROM users
    WHERE push_token IS NOT NULL
  `);

  for (const user of users) {
    // Get tasks due in 7, 3, or 1 day
    const today = new Date();
    const sevenDaysFromNow = addDays(today, 7);
    const threeDaysFromNow = addDays(today, 3);
    const oneDayFromNow = addDays(today, 1);

    const tasks = await db.query(`
      SELECT ut.id, ut.due_date, tm.title, tm.description
      FROM user_tasks ut
      JOIN tasks_metadata tm ON ut.task_metadata_id = tm.id
      WHERE ut.auth_user_id = $1
        AND ut.status != 'DONE'
        AND (
          DATE(ut.due_date) = DATE($2) OR
          DATE(ut.due_date) = DATE($3) OR
          DATE(ut.due_date) = DATE($4)
        )
    `, [user.auth_user_id, sevenDaysFromNow, threeDaysFromNow, oneDayFromNow]);

    // Group tasks by reminder type
    const sevenDayTasks = tasks.filter(t => isSameDay(t.due_date, sevenDaysFromNow));
    const threeDayTasks = tasks.filter(t => isSameDay(t.due_date, threeDaysFromNow));
    const oneDayTasks = tasks.filter(t => isSameDay(t.due_date, oneDayFromNow));

    // Send notifications
    if (sevenDayTasks.length > 0) {
      await sendSevenDayReminder(user, sevenDayTasks);
    }
    if (threeDayTasks.length > 0) {
      await sendThreeDayReminder(user, threeDayTasks);
    }
    if (oneDayTasks.length > 0) {
      await sendOneDayReminder(user, oneDayTasks);
    }
  }
});
```

## Notification Messages (Hebrew)

### 7-Day Reminder
**Single Task:**
```
Title: 📅 תזכורת: 7 ימים למשימה
Body: נותרו 7 ימים למשימה: [שם המשימה]
```

**Multiple Tasks:**
```
Title: 📅 תזכורת: 7 ימים למשימות
Body: נותרו 7 ימים ל-[מספר] משימות. לחץ לצפייה בפרטים.
```

### 3-Day Reminder
**Single Task:**
```
Title: ⚠️ תזכורת: 3 ימים למשימה
Body: נותרו רק 3 ימים למשימה: [שם המשימה]
```

**Multiple Tasks:**
```
Title: ⚠️ תזכורת: 3 ימים למשימות
Body: נותרו רק 3 ימים ל-[מספר] משימות. לחץ לצפייה בפרטים.
```

### 1-Day Reminder (Critical)
**Single Task:**
```
Title: 🚨 דחוף: יום אחד למשימה!
Body: נותר יום אחד בלבד למשימה: [שם המשימה] - דורש טיפול מיידי!
Priority: MAX
```

**Multiple Tasks:**
```
Title: 🚨 דחוף: יום אחד למשימות!
Body: נותר יום אחד בלבד ל-[מספר] משימות - דורש טיפול מיידי!
Priority: MAX
```

## Testing

### Frontend Test Button
The profile screen includes a "שלח 3 התראות בדיקה" (Send 3 Test Notifications) button that:
1. Fetches the user's tasks
2. Picks a random task (or uses "משימה לדוגמה" if no tasks exist)
3. Sends all 3 types of reminders (7-day, 3-day, 1-day) with 2-second intervals
4. Demonstrates the complete notification flow

**Usage:**
1. Navigate to Profile screen
2. Tap "שלח 3 התראות בדיקה"
3. You will receive 3 notifications:
   - Immediate: 7-day reminder
   - After 2 seconds: 3-day reminder
   - After 4 seconds: 1-day critical reminder

### Manual Testing
```javascript
// Test immediate notification
import { showImmediateNotification } from '@/utils/notifications';
await showImmediateNotification('Test Title', 'Test Body');

// Test all 3 reminder types
import { sendTestTaskReminders } from '@/utils/notifications';
await sendTestTaskReminders('משימה לדוגמה');
```

## Configuration

### Android
```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/final_quest_240x240.png",
          "color": "#ffffff",
          "androidMode": "collapse",
          "androidCollapsedTitle": "Different"
        }
      ]
    ],
    "android": {
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK"
      ]
    }
  }
}
```

**Notification Channel:**
- Name: "תזכורות משימות" (Task Reminders)
- Importance: MAX
- Vibration: [0, 250, 250, 250]
- Light Color: #2784F5 (Primary Blue)

### iOS
```json
// app.json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.yourapp",
      "infoPlist": {
        "UIBackgroundModes": [
          "remote-notification"
        ]
      }
    }
  }
}
```

## Dependencies
```json
{
  "expo-notifications": "^0.32.16",
  "expo-device": "^8.0.10",
  "expo-constants": "~18.0.8"
}
```

## Error Handling

### Frontend
- Graceful degradation if notifications are not supported
- Logs warnings instead of throwing errors
- Non-blocking registration (doesn't prevent app usage)
- Multiple fallback strategies for token retrieval

### Backend (Proposed)
- Retry logic for failed push notifications
- Logging of all notification attempts
- Graceful handling of invalid/expired push tokens
- Rate limiting to prevent spam

## Security Considerations

1. **Push Token Storage**: Tokens are stored securely in the database
2. **User Privacy**: Only send notifications to users who have granted permission
3. **Data Validation**: Validate all user data before sending notifications
4. **Rate Limiting**: Prevent abuse by limiting notification frequency

## Future Enhancements

1. **Custom Notification Preferences**: Allow users to customize reminder timing
2. **Notification History**: Track which notifications were sent and when
3. **Rich Notifications**: Add action buttons (e.g., "Mark as Done", "Snooze")
4. **Notification Analytics**: Track open rates and engagement
5. **Multi-language Support**: Support for languages other than Hebrew
6. **Smart Scheduling**: Adjust notification times based on user activity patterns

## Troubleshooting

### Notifications Not Appearing
1. Check device permissions (Settings > Notifications)
2. Verify push token is saved in database
3. Check notification channel settings (Android)
4. Ensure app is not in battery optimization mode
5. Verify Expo push notification service is operational

### Token Registration Fails
1. Ensure device is physical (not simulator)
2. Check EAS project ID in app.json
3. Verify network connectivity
4. Check Expo CLI version compatibility

### Backend Job Not Running
1. Verify cron schedule is correct (9:00 AM Israel Time)
2. Check server timezone configuration
3. Verify database connection
4. Check Expo push notification API credentials

## Support

For issues or questions:
1. Check frontend logs: `console.log` statements in `utils/notifications.ts`
2. Check backend logs: Cron job execution logs
3. Verify Expo push notification dashboard for delivery status
4. Test with the profile screen test button first

---

**Last Updated**: January 2025
**Version**: 2.0 (Updated with test button and 9:00 AM schedule)
