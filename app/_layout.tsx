import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const handleDeepLink = (url: string) => {
  console.log('Deep link received:', url);
  const hash = url.split('#')[1];
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token && refresh_token) {
    console.log('Setting session from deep link');
    supabase.auth.setSession({ access_token, refresh_token })
      .catch(err => console.error('Error setting session:', err));
  }
};

function InitialLayout() {
  useFrameworkReady();
  const { session, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => handleDeepLink(event.url));
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });

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
      <Stack.Screen name="login" options={{ animation: 'none' }} />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="home-service" />
      <Stack.Screen name="products" />
      <Stack.Screen name="cart" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="warehouse" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="hometailor" />
      <Stack.Screen name="help-support" />
      <Stack.Screen name="privacy-security" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <AuthProvider>
      <InitialLayout />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
