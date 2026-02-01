// app/_layout.tsx
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Deep link handler
const handleDeepLink = (url: string) => {
  console.log('Deep link received in layout:', url);
  const hash = url.split('#')[1];
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token && refresh_token) {
    console.log('Tokens found in URL, setting session...');
    supabase.auth.setSession({ access_token, refresh_token })
      .catch(err => console.error("Error setting session from deeplink", err));
  }
};

const InitialLayout = () => {
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // 1. Set up deep link listeners
    const subscription = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

    // 2. Handle navigation after auth state is determined
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    if (session && !inAuthGroup) {
      router.replace('/(tabs)');
    } else if (!session && inAuthGroup) {
      router.replace('/login');
    }

    return () => subscription.remove();
  }, [session, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="login" options={{ animation: 'none' }} />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="(tabs)" />
      {/* ... keep your other screens ... */}
      <Stack.Screen name="books" />
      <Stack.Screen name="audios" />
      <Stack.Screen name="videos" />
      <Stack.Screen name="newsletters" />
      <Stack.Screen name="gallery" />
      <Stack.Screen name="patient-god" />
      <Stack.Screen name="counselor" />
      <Stack.Screen name="counselling" />
      <Stack.Screen name="admission" />
      <Stack.Screen name="volunteer" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}