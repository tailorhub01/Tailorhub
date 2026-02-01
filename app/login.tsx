// app/login.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert('Error', error.message);
    // The root layout will handle navigation
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { 
            redirectTo: `${window.location.origin}/auth/callback`
          },
        });
        if (error) Alert.alert('Error', error.message);
        setIsLoading(false);
        return;
      }

      const redirectUrl = AuthSession.makeRedirectUri({ 
        scheme: 'tailorhub',
        path: 'auth/callback' 
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Required for manual browser opening
        },
      });

      if (error) {
        Alert.alert('Error', error.message);
        setIsLoading(false);
        return;
      }
      if (!data?.url) {
        Alert.alert('Error', 'No URL returned from Supabase');
        setIsLoading(false);
        return;
      }

      // Open the browser
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      // Handle the result
      if (result.type === 'success' && result.url) {
        // The deep link handler in _layout.tsx will process the tokens
        console.log('OAuth success, tokens will be processed by deep link handler');
      }

    } catch (err) {
      console.error('Google sign-in error:', err);
      Alert.alert('Error', 'An unexpected error occurred during sign-in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestAccess = () => router.replace('/(tabs)');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7c3aed', '#a855f7', '#c084fc']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>TH</Text>
          </View>
        </View>
        <Text style={styles.welcomeText}>Welcome to Tailor Hub</Text>
        <Text style={styles.subtitleText}>
          Your trusted partner for all tailoring needs
        </Text>
      </View>
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <Mail size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.inputContainer}>
          <Lock size={20} color="#6b7280" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff size={20} color="#6b7280" />
            ) : (
              <Eye size={20} color="#6b7280" />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={isLoading}>
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={isLoading}>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.guestButton} onPress={handleGuestAccess}>
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles are unchanged
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#7c3aed",
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  logoContainer: { width: 80, height: 40, marginBottom: 24, justifyContent: "center", alignItems: "center" },
  logoPlaceholder: { width: 80, height: 40, backgroundColor: "#ffffff", borderRadius: 8, justifyContent: "center", alignItems: "center" },
  logoText: { fontSize: 16, fontWeight: "bold", color: "#7c3aed" },
  welcomeText: { fontSize: 28, fontWeight: "bold", color: "#ffffff", marginBottom: 8 },
  subtitleText: { fontSize: 16, color: "rgba(255, 255, 255, 0.8)", textAlign: "center" },
  formContainer: { backgroundColor: "#ffffff", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, minHeight: 400 },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 12, marginBottom: 16, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: "#e5e7eb" },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: "#111827" },
  eyeIcon: { padding: 4 },
  loginButton: { backgroundColor: "#7c3aed", borderRadius: 12, height: 56, justifyContent: "center", alignItems: "center", marginTop: 8, marginBottom: 24 },
  loginButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "600" },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { marginHorizontal: 16, color: "#6b7280", fontSize: 14 },
  googleButton: { backgroundColor: "#ffffff", borderRadius: 12, height: 56, justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  googleButtonText: { color: "#374151", fontSize: 16, fontWeight: "600" },
  guestButton: { backgroundColor: "transparent", borderRadius: 12, height: 56, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  guestButtonText: { color: "#7c3aed", fontSize: 16, fontWeight: "600" },
  forgotPassword: { alignItems: "center" },
  forgotPasswordText: { color: "#6b7280", fontSize: 14 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#7c3aed" },
  loadingText: { color: "#ffffff", fontSize: 16 }
});