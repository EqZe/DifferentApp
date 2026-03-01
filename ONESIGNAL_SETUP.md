
# OneSignal Push Notifications Setup

## ✅ What's Been Configured

Your app has been successfully configured to use **OneSignal** for push notifications, replacing the previous Expo/Supabase notification system.

### Files Created/Modified:

1. **`contexts/OneSignalContext.tsx`** - OneSignal provider that initializes the SDK and manages notification permissions
2. **`app/_layout.tsx`** - Updated to wrap the app with `OneSignalProvider`
3. **`components/NotificationBell.tsx`** - Updated to use OneSignal permission status
4. **`app/notification-preferences.tsx`** - Updated to use OneSignal tags for notification preferences
5. **`app/(tabs)/(home)/index.tsx`** & **`app/(tabs)/(home)/index.ios.tsx`** - Added NotificationBell to home screen header
6. **`app.json`** - Added `onesignal-expo-plugin` configuration

### Dependencies Installed:

- `react-native-onesignal` - OneSignal React Native SDK
- `onesignal-expo-plugin` - Expo config plugin for OneSignal

## 🔧 Required Configuration

### Step 1: Get Your OneSignal App ID

1. Go to [OneSignal Dashboard](https://onesignal.com/)
2. Create a new app or select your existing app
3. Copy your **OneSignal App ID** (found in Settings > Keys & IDs)

### Step 2: Update app.json

You need to add your OneSignal App ID to `app.json`. Update the `onesignal-expo-plugin` configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "onesignal-expo-plugin",
        {
          "mode": "development",
          "devTeam": "YOUR_APPLE_TEAM_ID",
          "iPhoneDeploymentTarget": "13.4"
        }
      ]
    ]
  }
}
```

### Step 3: Initialize OneSignal with Your App ID

Update `contexts/OneSignalContext.tsx` to include your OneSignal App ID:

```typescript
// In contexts/OneSignalContext.tsx, add this line after the try block:
OneSignal.setAppId('YOUR_ONESIGNAL_APP_ID');
```

Or configure it in `app.json` extra config:

```json
{
  "expo": {
    "extra": {
      "oneSignalAppId": "YOUR_ONESIGNAL_APP_ID"
    }
  }
}
```

### Step 4: Configure iOS Push Certificates

For iOS push notifications to work:

1. Go to OneSignal Dashboard > Settings > Platforms > Apple iOS
2. Upload your Apple Push Notification certificate (.p12 file)
3. Or configure using Apple Push Notification Authentication Key (recommended)

### Step 5: Configure Android

For Android, OneSignal uses Firebase Cloud Messaging (FCM):

1. Go to OneSignal Dashboard > Settings > Platforms > Google Android
2. Enter your Firebase Server Key and Sender ID
3. Or upload your `google-services.json` file

## 📱 How It Works

### User Flow:

1. **App Launch**: OneSignal SDK initializes automatically
2. **Permission Request**: User can enable notifications from the notification preferences screen
3. **User Identification**: When a user logs in, their user ID is set in OneSignal for targeted notifications
4. **Notification Preferences**: Users can toggle different notification types (tasks, containers, schedule, announcements)
5. **Receiving Notifications**: Notifications are received and can be clicked to navigate to relevant screens

### Notification Bell:

- Shows in the home screen header (top right)
- Displays a warning badge if notifications are not enabled
- Taps navigate to notification preferences screen
- Hidden on web platform (push notifications only work on native)

### Notification Preferences:

- Accessible via the notification bell or from profile screen
- Allows users to enable/disable notifications
- Manages notification categories using OneSignal tags:
  - `task_reminders` - Task deadline reminders
  - `container_updates` - Container status updates
  - `schedule_changes` - Travel schedule changes
  - `general_announcements` - General system announcements

## 🧪 Testing Push Notifications

### From OneSignal Dashboard:

1. Go to OneSignal Dashboard > Messages > New Push
2. Select your app
3. Compose your message
4. Target specific users by External User ID (your app's user ID)
5. Or target by tags (e.g., users with `task_reminders: true`)
6. Send the notification

### Testing Locally:

The notification bell will show a warning badge if permissions are not granted. Users can tap it to enable notifications.

## 🔐 User Segmentation

OneSignal automatically tags users with:

- `user_id` - Your app's user ID
- `full_name` - User's full name
- `city` - User's city
- `has_contract` - Whether user has signed a contract
- `task_reminders` - Task reminder preference
- `container_updates` - Container update preference
- `schedule_changes` - Schedule change preference
- `general_announcements` - General announcement preference

You can use these tags to send targeted notifications from the OneSignal dashboard.

## 🚀 Sending Notifications from Your Backend

If you want to send notifications programmatically from your backend:

```typescript
// Example: Send notification to specific user
const response = await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic YOUR_ONESIGNAL_REST_API_KEY',
  },
  body: JSON.stringify({
    app_id: 'YOUR_ONESIGNAL_APP_ID',
    include_external_user_ids: ['user_id_123'],
    contents: { en: 'Your container has been updated!' },
    headings: { en: 'Container Update' },
    data: { type: 'container_update', containerId: '123' },
  }),
});
```

## 📚 Additional Resources

- [OneSignal React Native SDK Documentation](https://documentation.onesignal.com/docs/react-native-sdk-setup)
- [OneSignal Expo Plugin Documentation](https://github.com/OneSignal/onesignal-expo-plugin)
- [OneSignal REST API Documentation](https://documentation.onesignal.com/reference/create-notification)

## ⚠️ Important Notes

1. **Web Platform**: Push notifications are only available on native platforms (iOS/Android). The notification bell is hidden on web.

2. **Permissions**: Users must grant notification permissions for push notifications to work. The app will prompt users when they tap "Enable Notifications" in the preferences screen.

3. **Testing**: For testing, use a physical device. Push notifications don't work in iOS Simulator or Android Emulator.

4. **Migration**: The old Expo Notifications system has been replaced. The `utils/notifications.ts` file is no longer used for push notifications (but can be kept for local notifications if needed).

5. **Build**: After configuring OneSignal, you'll need to rebuild your app with `expo prebuild` and create a new build for the changes to take effect.

## 🔄 Migration from Old System

The following changes were made to migrate from Expo Notifications to OneSignal:

- ❌ Removed: Expo push token registration
- ❌ Removed: Supabase push token storage
- ✅ Added: OneSignal SDK initialization
- ✅ Added: OneSignal user identification
- ✅ Added: OneSignal tag-based preferences
- ✅ Updated: Notification bell to use OneSignal permission status
- ✅ Updated: Notification preferences to use OneSignal tags

The old notification system files (`utils/notifications.ts`, profile screen push registration) are still present but no longer used for push notifications. You can remove them if desired, or keep them for local notification functionality.
