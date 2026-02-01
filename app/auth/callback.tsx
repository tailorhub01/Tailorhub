// app/auth/callback.tsx
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (Platform.OS === 'web') {
          // Handle web OAuth callback
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            router.replace('/login');
            return;
          }

          if (data.session) {
            console.log('Auth successful, redirecting to app');
            router.replace('/(tabs)');
          } else {
            console.log('No session found, redirecting to login');
            router.replace('/login');
          }
        } else {
          // For mobile, the deep link handler in _layout.tsx handles this
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        router.replace('/login');
      }
    };

    // Small delay to ensure the URL parameters are processed
    const timer = setTimeout(handleAuthCallback, 1000);
    
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
  },
  text: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 16,
  },
});