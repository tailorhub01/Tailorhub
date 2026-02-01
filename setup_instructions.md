# Google OAuth Setup Instructions

This app is configured with Google OAuth authentication using Supabase. Follow these steps to complete the setup:

## 1. Configure Google OAuth in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Configure the OAuth settings:
   - Add your Google Client ID
   - Add your Google Client Secret
   - Add the redirect URL: `https://xtglbjpnpumutokxtnqn.supabase.co/auth/v1/callback`

## 2. Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen
6. Add authorized redirect URIs:
   - `https://xtglbjpnpumutokxtnqn.supabase.co/auth/v1/callback`
   - `myapp://auth/callback` (for mobile deep linking)

## 3. Building the APK

### Option A: Build with EAS (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Build Android APK
eas build --platform android --profile preview
```

### Option B: Local Build

```bash
# Install dependencies
npm install

# Start the development server
npm run dev

# In a new terminal, build the app
npx expo run:android
```

## 4. Testing the Authentication Flow

1. Install the APK on your Android device
2. Open the app
3. Tap "Continue with Google"
4. Select your Google account
5. Grant permissions
6. You'll be redirected back to the app automatically

## Deep Linking Configuration

The app uses the scheme `myapp://` for deep linking. This is configured in:
- `app.json` - scheme: "myapp"
- The authentication callback will redirect to `myapp://auth/callback`

## Environment Variables

Your Supabase credentials are already configured in `.env`:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

## Troubleshooting

### Google OAuth not working
- Ensure the redirect URIs are correctly configured in Google Cloud Console
- Verify that the Google provider is enabled in Supabase
- Check that your Google Client ID and Secret are correct in Supabase

### Deep linking not working
- Make sure the app scheme matches in `app.json`
- On Android, ensure the package name is unique: `com.myapp.expo`
- Test the deep link: `adb shell am start -W -a android.intent.action.VIEW -d "myapp://auth/callback"`

### App crashes on startup
- Clear the app data and cache
- Rebuild the app with `eas build --platform android --profile preview --clear-cache`
