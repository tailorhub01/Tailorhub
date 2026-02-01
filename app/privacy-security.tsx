import { Platform } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Lock, Eye, UserCheck } from 'lucide-react-native';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  return (
    <View style={styles.container}>
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.iconHeader}>
            <Shield size={32} color="#7c3aed" />
            <Text style={styles.mainTitle}>Your Privacy Matters</Text>
          </View>
          <Text style={styles.introText}>
            At Tailor Hub, we are committed to protecting your personal information and ensuring your privacy. 
            This policy explains how we collect, use, and safeguard your data.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <UserCheck size={24} color="#059669" />
            <Text style={styles.sectionTitle}>Information We Collect</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            <Text style={styles.cardText}>
              • Name, email address, and phone number{'\n'}
              • Delivery addresses{'\n'}
              • Order history and preferences{'\n'}
              • Payment information (securely processed)
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Usage Information</Text>
            <Text style={styles.cardText}>
              • App usage patterns{'\n'}
              • Device information{'\n'}
              • Location data (with permission){'\n'}
              • Service preferences
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={24} color="#dc2626" />
            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              • Process and fulfill your orders{'\n'}
              • Provide customer support{'\n'}
              • Send order updates and notifications{'\n'}
              • Improve our services{'\n'}
              • Prevent fraud and ensure security{'\n'}
              • Comply with legal requirements
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={24} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Information Sharing</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>We DO NOT sell your personal information</Text>
            <Text style={styles.cardText}>
              We may share your information only in these limited circumstances:{'\n\n'}
              • With service providers (delivery partners, payment processors){'\n'}
              • When required by law{'\n'}
              • To protect our rights and safety{'\n'}
              • With your explicit consent
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Shield size={24} color="#7c3aed" />
            <Text style={styles.sectionTitle}>Data Security</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              • All data is encrypted in transit and at rest{'\n'}
              • Secure payment processing through trusted providers{'\n'}
              • Regular security audits and updates{'\n'}
              • Limited access to personal information{'\n'}
              • Secure data centers with 24/7 monitoring
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              You have the right to:{'\n\n'}
              • Access your personal information{'\n'}
              • Correct inaccurate data{'\n'}
              • Delete your account and data{'\n'}
              • Opt-out of marketing communications{'\n'}
              • Request data portability{'\n'}
              • File a complaint with authorities
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.card}>
            <Text style={styles.cardText}>
              If you have any questions about this Privacy Policy or your data:{'\n\n'}
              Email: privacy@tailorhub.com{'\n'}
              Phone: +91 98765 43210{'\n'}
              Address: 123 Fashion Street, Hyderabad, Telangana - 500001
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.lastUpdated}>Last updated: December 2024</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerWeb: {
    paddingTop: 20,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  introText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});