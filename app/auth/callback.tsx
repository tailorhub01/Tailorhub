// app/auth/callback.tsx
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function AuthCallbackScreen() {
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
    backgroundColor: '#065f46',
  },
  text: {
    marginTop: 16,
    color: '#ffffff',
    fontSize: 16,
  },
});