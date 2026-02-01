# How to Build Android APK

## Prerequisites
- Node.js installed
- Expo account (create at https://expo.dev)
- Android device or emulator for testing

## Quick Start

### 1. Install EAS CLI
```bash
npm install -g eas-cli
```

### 2. Login to Expo
```bash
eas login
```

### 3. Configure EAS Build
```bash
eas build:configure
```
When prompted, select:
- Platform: Android
- Profile: preview (for APK)

### 4. Build the APK
```bash
eas build --platform android --profile preview
```

This will:
1. Upload your code to Expo servers
2. Build the Android APK
3. Provide a download link when complete (usually takes 10-20 minutes)

### 5. Download and Install
Once the build completes:
1. Download the APK from the provided link
2. Transfer it to your Android device
3. Enable "Install from Unknown Sources" in Android settings
4. Install the APK

## Alternative: Local Development Build

If you want to build locally for testing (not recommended for production):

```bash
# Install dependencies
npm install

# Fix any dependency issues
npx expo install --fix

# Create development build
npx expo run:android
```

**Important**: Local builds often have issues with:
- Environment variables not loading properly
- Authentication not working correctly
- White screen on startup

**Use EAS Build instead** for reliable APK generation.

## Fixing White Screen Issues

If your APK shows a white screen:

1. **Use EAS Build instead of local build**:
   ```bash
   eas build --platform android --profile preview
   ```

2. **Check environment variables** in `.env` file

3. **Verify Supabase configuration** is correct

4. **Clear build cache**:
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```

## What's Already Configured

The app is ready to build with:
- Google OAuth authentication via Supabase
- Deep linking configured with `myapp://` scheme
- Android package: `com.myapp.expo`
- All dependencies installed

## Testing Google OAuth

Before building, ensure you've:
1. Configured Google OAuth in Supabase Dashboard
2. Added the redirect URI in Google Cloud Console:
   - `https://xtglbjpnpumutokxtnqn.supabase.co/auth/v1/callback`
   - `myapp://auth/callback`

## Build Profiles

You can create different build profiles in `eas.json`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

- `preview`: Creates APK for testing
- `production`: Creates AAB for Google Play Store

## Common Issues

### "Build failed to start"
- Check your Expo account has an active subscription (free tier is fine)
- Ensure all dependencies in package.json are valid

### "White screen on app startup"
- **Don't use local builds** (`npx expo run:android`)
- **Use EAS Build**: `eas build --platform android --profile preview`
- Check environment variables are properly configured
- Verify Supabase URL and keys are correct

### "Deep linking not working"
- Verify the scheme in app.json matches: `myapp://`
- Test with: `adb shell am start -W -a android.intent.action.VIEW -d "myapp://"`

### "Google sign in fails"
- Ensure OAuth is configured in Supabase
- Check redirect URIs match exactly
- Verify your Supabase URL and anon key in .env
