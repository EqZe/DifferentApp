
# Fix: Email Rate Limit Exceeded Error

## Problem
You're seeing "email rate limit exceeded" errors because Supabase Auth is sending verification emails for every signup, and you've hit the rate limit.

## Solution
Disable email confirmation in Supabase Dashboard so users can sign up and sign in immediately without email verification.

## Steps to Fix (IMPORTANT - DO THIS NOW):

### 1. Go to Supabase Dashboard
- Open: https://supabase.com/dashboard/project/pgrcmurwamszgjsdbgtq

### 2. Navigate to Authentication Settings
- Click on **Authentication** in the left sidebar
- Click on **Providers** 
- Find **Email** provider

### 3. Disable Email Confirmation
- Scroll down to find **"Confirm email"** toggle
- **Turn OFF** the "Confirm email" toggle
- This allows users to sign up and sign in immediately without email verification

### 4. Save Changes
- Click **Save** at the bottom of the page

### 5. Optional: Increase Rate Limits (if needed)
- Go to **Authentication** → **Rate Limits**
- You can increase the rate limits for:
  - Sign up: Default is 5 per hour per IP
  - Sign in: Default is 30 per hour per IP
  - Password recovery: Default is 5 per hour per IP

## What Changed in the Code

### 1. Better Error Messages (Hebrew)
- Rate limit error: "יותר מדי ניסיונות הרשמה. אנא נסה שוב בעוד מספר דקות."
- Already registered: "המייל כבר רשום במערכת. נסה להתחבר במקום."
- Invalid credentials: "אימייל או סיסמה שגויים"

### 2. Improved Error Handling
- Added try-catch blocks with specific error handling
- Better logging for debugging
- Cleanup of auth user if profile creation fails

### 3. Supabase Client Configuration
- Updated auth flow configuration
- Added PKCE flow for better security

## Testing After Fix

1. Try to sign up with a new email
2. You should be able to sign up immediately without email verification
3. You should be redirected to the home screen automatically
4. Try to sign in with the same credentials - should work immediately

## Important Notes

- **Email verification is now disabled** - users can sign up and use the app immediately
- If you want to re-enable email verification later, you can turn it back on in the dashboard
- The rate limit error should no longer occur since no verification emails are being sent
- Users can still reset their password via email if needed

## If You Still See Errors

1. Wait 1 hour for the rate limit to reset
2. Make sure you saved the changes in Supabase Dashboard
3. Clear your app cache and try again
4. Check the console logs for specific error messages
