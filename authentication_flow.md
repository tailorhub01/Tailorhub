# Authentication Flow Documentation

## Overview
This app implements Google OAuth authentication using Supabase with support for both web and native Android platforms.

## Architecture

### Key Components

1. **AuthContext** (`contexts/AuthContext.tsx`)
   - Manages authentication state globally
   - Listens to Supabase auth state changes
   - Provides session, user, and profile data to all screens

2. **Login Screen** (`app/login.tsx`)
   - Email/Password authentication
   - Google OAuth sign-in
   - Guest access option

3. **Root Layout** (`app/_layout.tsx`)
   - Deep link handler for OAuth callback
   - Navigation protection (redirects based on auth state)
   - Wraps app with AuthProvider

4. **Callback Screen** (`app/auth/callback.tsx`)
   - Temporary screen shown during OAuth redirect
   - Displays loading state while processing authentication

## Authentication Flow

### Google OAuth Flow (Android)

1. User taps "Continue with Google" on login screen
2. App opens browser with Supabase OAuth URL
3. User authenticates with Google
4. Google redirects to Supabase callback URL
5. Supabase processes authentication and redirects to `myapp://auth/callback`
6. App deep link handler receives tokens in URL hash
7. Tokens are extracted and set in Supabase session
8. AuthContext detects session change
9. User is automatically redirected to home screen

### Deep Linking

The app uses the custom URL scheme `myapp://` for OAuth callbacks:

- **Scheme**: `myapp://`
- **Callback Path**: `auth/callback`
- **Full URL**: `myapp://auth/callback#access_token=xxx&refresh_token=yyy`

Deep link handling is implemented in `app/_layout.tsx`:

```typescript
const handleDeepLink = (url: string) => {
  const hash = url.split('#')[1];
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token && refresh_token) {
    supabase.auth.setSession({ access_token, refresh_token });
  }
};
```

## Navigation Protection

The app automatically redirects users based on authentication state:

- **Not authenticated**: Redirected to `/login`
- **Authenticated**: Redirected to `/(tabs)` (home)

This is handled in the `InitialLayout` component:

```typescript
const inAuthGroup = segments[0] === '(tabs)';
if (session && !inAuthGroup) {
  router.replace('/(tabs)');
} else if (!session && inAuthGroup) {
  router.replace('/login');
}
```

## Session Management

### Persistence
Sessions are persisted using AsyncStorage:

```typescript
auth: {
  storage: AsyncStorage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
}
```

### Automatic Refresh
Supabase automatically refreshes tokens before they expire.

### Sign Out
```typescript
const { signOut } = useAuth();
await signOut();
```

## User Profile

The profile is extracted from the Supabase user metadata:

```typescript
{
  id: session.user.id,
  email: session.user.email,
  full_name: session.user.user_metadata?.name,
  avatar_url: session.user.user_metadata?.picture,
  created_at: session.user.created_at,
}
```

## Environment Configuration

Required environment variables in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xtglbjpnpumutokxtnqn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Platform Differences

### Web
- Uses standard OAuth redirect
- Redirects to `window.location.origin`

### Android/iOS
- Uses `expo-auth-session` for OAuth
- Opens system browser with `WebBrowser.openAuthSessionAsync`
- Handles deep link callback with `expo-linking`
- Requires custom URL scheme configuration

## Supabase Configuration Required

### 1. Enable Google Provider
In Supabase Dashboard > Authentication > Providers:
- Enable Google
- Add Google Client ID and Secret

### 2. Configure Redirect URLs
Add these URLs to your Google OAuth app:
- `https://xtglbjpnpumutokxtnqn.supabase.co/auth/v1/callback`
- `myapp://auth/callback`

### 3. Site URL
Set in Supabase Dashboard > Authentication > URL Configuration:
- Site URL: Your app's production URL

## Testing

### Local Development (Web)
```bash
npm run dev
```

### Android APK Testing
1. Build APK: `eas build --platform android --profile preview`
2. Install on device
3. Test Google OAuth flow
4. Verify deep linking works

### Debug Deep Links
```bash
# Test deep link on Android
adb shell am start -W -a android.intent.action.VIEW -d "myapp://auth/callback"
```

## Troubleshooting

### OAuth Fails Silently
- Check Supabase logs in Dashboard
- Verify Google OAuth credentials
- Ensure redirect URLs match exactly

### Deep Link Not Opening App
- Verify scheme in `app.json` matches
- Check Android package name is unique
- Rebuild app after changing configuration

### Session Not Persisting
- Check AsyncStorage is installed
- Verify Supabase client configuration
- Clear app data and test again

### User Stuck on Login Screen
- Check AuthContext loading state
- Verify navigation logic in root layout
- Check for errors in console logs
