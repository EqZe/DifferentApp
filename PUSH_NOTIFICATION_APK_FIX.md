
# Push Notification APK Fix - Complete Solution

## Problem
When clicking "הירשם להתראות" (Register for Notifications) on an Android APK build, users received the error:
```
לא ניתן לקבל טוקן הרשאות. אנא צור קשר עם התמיכה.
(Cannot get authorization token. Please contact support.)
```

## Root Cause
The error occurred because:
1. **Missing EAS Project ID**: The `app.json` file had the EAS project ID in the wrong location
2. **Incorrect fallback logic**: The notification code wasn't properly handling the case where the project ID wasn't found
3. **Poor error messages**: The error didn't clearly indicate what was wrong

## Solution Implemented

### 1. Fixed `app.json` Configuration
**File**: `app.json`

**Changes**:
- Moved EAS project ID to the correct location: `expo.extra.eas.projectId`
- Added `googleServicesFile` reference for Android (required for FCM in production)

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "fe404aca-e46f-42c2-ac3a-50c265d87ae7"
      }
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### 2. Updated Notification Registration Logic
**File**: `utils/notifications.ts`

**Key Changes**:

#### A. Better Project ID Detection
```typescript
// Try multiple sources for the project ID
let projectId = Constants.expoConfig?.extra?.eas?.projectId;

if (!projectId) {
  // Fallback to easConfig (used in standalone builds)
  projectId = Constants.easConfig?.projectId;
}
```

#### B. Improved Error Handling
```typescript
// Provide specific error messages based on error type
if (tokenError?.message?.includes('network')) {
  throw new Error('בעיית רשת. אנא בדוק את חיבור האינטרנט שלך ונסה שוב.');
} else if (tokenError?.message?.includes('projectId')) {
  throw new Error('האפליקציה לא מוגדרת כראוי. חסר מזהה פרויקט EAS.');
} else if (tokenError?.code === 'E_REGISTRATION_FAILED') {
  throw new Error('הרשמה להתראות נכשלה. אנא ודא שהאפליקציה מותקנת כראוי.');
}
```

#### C. Better Device Detection
```typescript
// Allow registration if running on physical device OR in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';
const isPhysicalDevice = Device.isDevice;
const canRegister = isPhysicalDevice || isExpoGo || Platform.OS === 'web';

if (!canRegister) {
  throw new Error('התראות זמינות רק במכשירים פיזיים. אנא התקן את האפליקציה על מכשיר אמיתי.');
}
```

## How It Works Now

### For Expo Go (Development)
1. App detects it's running in Expo Go (`Constants.appOwnership === 'expo'`)
2. Calls `getExpoPushTokenAsync()` without requiring project ID
3. Returns token in format: `ExponentPushToken[xxxxxx]`

### For Standalone APK (Production)
1. App reads EAS project ID from `Constants.expoConfig.extra.eas.projectId`
2. Calls `getExpoPushTokenAsync({ projectId })` with the project ID
3. Returns token in format: `ExponentPushToken[xxxxxx]`
4. Token is saved to Supabase database via `api.savePushToken()`

## Testing Instructions

### Test on Android APK:
1. Build the APK with: `eas build --platform android --profile preview`
2. Install the APK on a physical Android device
3. Login to the app
4. Go to Profile screen
5. Click "הירשם להתראות" (Register for Notifications)
6. Grant notification permissions when prompted
7. Should see success message: "התראות Push הופעלו בהצלחה!"

### Test on Expo Go:
1. Run: `expo start`
2. Scan QR code with Expo Go app
3. Login to the app
4. Go to Profile screen
5. Click "הירשם להתראות"
6. Should work without requiring EAS project ID

## Error Messages (Hebrew)

The app now provides clear, user-friendly error messages:

| Error Type | Message |
|------------|---------|
| Not physical device | התראות זמינות רק במכשירים פיזיים. אנא התקן את האפליקציה על מכשיר אמיתי. |
| Network error | בעיית רשת. אנא בדוק את חיבור האינטרנט שלך ונסה שוב. |
| Missing project ID | האפליקציה לא מוגדרת כראוי. חסר מזהה פרויקט EAS. |
| Registration failed | הרשמה להתראות נכשלה. אנא ודא שהאפליקציה מותקנת כראוי. |
| Permissions denied | לא ניתנו הרשאות להתראות. אנא אפשר התראות בהגדרות המכשיר. |

## Important Notes

### About EAS Project ID in app.json
- **For Expo Go**: The EAS project ID is NOT required. The app will work without it.
- **For APK builds**: The EAS project ID IS required for push notifications to work.
- **Location**: Must be in `expo.extra.eas.projectId` (not `expo.eas.projectId`)

### About google-services.json
- Required for production Android builds with Firebase Cloud Messaging (FCM)
- Not required for Expo Go
- Should be placed in the root directory
- Reference it in `app.json` under `android.googleServicesFile`

### Supabase Integration
The app uses Supabase for:
1. **Storing push tokens**: Tokens are saved to the `users` table in the `push_token` column
2. **Sending notifications**: Supabase Edge Functions handle sending push notifications
3. **Task reminders**: Automatic reminders are sent via Edge Functions

## Verification

After implementing these fixes, verify:
- ✅ Push notification registration works on Android APK
- ✅ Push notification registration works on Expo Go
- ✅ Error messages are clear and in Hebrew
- ✅ Tokens are saved to Supabase database
- ✅ Test notifications can be sent successfully

## Files Modified
1. `app.json` - Added EAS project ID in correct location
2. `utils/notifications.ts` - Improved error handling and project ID detection
3. `app/(tabs)/profile.tsx` - Already had proper error display (no changes needed)
4. `app/(tabs)/profile.ios.tsx` - Already had proper error display (no changes needed)

## Next Steps
1. Test on a physical Android device with the APK
2. Verify push tokens are being saved to Supabase
3. Test sending push notifications from the admin panel
4. Set up automatic task reminders via Supabase Edge Functions
