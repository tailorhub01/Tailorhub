import React from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Calendar, LogOut, Package, Hop as Home, MapPin, Bell, Globe, Lock, Circle as HelpCircle, MessageCircle, ChevronRight, Warehouse, Crown, Wrench } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export default function ProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Debug log to check profile data
    console.log('Profile data:', profile);
    console.log('User role:', profile?.role);
    
    if (profile?.role) {
      setUserRole(profile.role.toLowerCase());
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, isWeb && styles.headerWeb]}>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <User size={40} color="#7c3aed" />
              </View>
            </View>

            <Text style={[styles.userName, styles.guestUserName]}>
  Guest User
</Text>
<Text style={[styles.userEmail, styles.guestUserEmail]}>
  Please login to access profile
</Text>

          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.loginPromptButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginPromptText}>Login to Your Account</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/addresses')}
            >
              <View style={styles.actionIcon}>
                <MapPin size={20} color="#7c3aed" />
              </View>
              <Text style={styles.actionText}>My Addresses</Text>
            </TouchableOpacity>
          </View>

          {/* Settings for guest users */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Bell size={20} color="#6b7280" />
                  </View>
                  <Text style={styles.settingLabel}>Notifications</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                  thumbColor={notificationsEnabled ? '#7c3aed' : '#f3f4f6'}
                />
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <Globe size={20} color="#6b7280" />
                  </View>
                  <Text style={styles.settingLabel}>Language</Text>
                </View>
                <View style={styles.settingRight}>
                  <Text style={styles.settingValue}>English</Text>
                  <ChevronRight size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <View style={styles.settingIcon}>
                    <HelpCircle size={20} color="#6b7280" />
                  </View>
                  <Text style={styles.settingLabel}>Help & Support</Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#7c3aed', '#a855f7']} style={[styles.header, isWeb && styles.headerWeb]}>
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <View style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color="#7c3aed" />
              </View>
            )}
          </View>

          <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Mail size={20} color="#6b7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={20} color="#6b7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsCard}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/home-service')}
              >
                <View style={styles.actionIcon}>
                  <Home size={20} color="#7c3aed" />
                </View>
                <Text style={styles.actionText}>Book Home Service</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/(tabs)/orders')}
              >
                <View style={styles.actionIcon}>
                  <Package size={20} color="#7c3aed" />
                </View>
                <Text style={styles.actionText}>My Orders</Text>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => router.push('/addresses')}
              >
                <View style={styles.actionIcon}>
                  <MapPin size={20} color="#7c3aed" />
                </View>
                <Text style={styles.actionText}>My Addresses</Text>
              </TouchableOpacity>

              {/* Role-based options */}
              {(userRole === 'warehouse' || userRole === 'admin') && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => router.push('/warehouse')}
                  >
                    <View style={styles.actionIcon}>
                      <Warehouse size={20} color="#7c3aed" />
                    </View>
                    <Text style={styles.actionText}>
                      {userRole === 'admin' ? 'Warehouse Management' : 'Manage Warehouse'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {userRole === 'admin' && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => router.push('/admin')}
                  >
                    <View style={styles.actionIcon}>
                      <Crown size={20} color="#dc2626" />
                    </View>
                    <Text style={styles.actionText}>Admin Panel</Text>
                  </TouchableOpacity>
                </>
              )}

              {(userRole === 'hometailor' || userRole === 'admin') && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={styles.actionRow}
                    onPress={() => router.push('/hometailor')}
                  >
                    <View style={styles.actionIcon}>
                      <Wrench size={20} color="#059669" />
                    </View>
                    <Text style={styles.actionText}>
                      {userRole === 'admin' ? 'Home Tailor Management' : 'Home Tailor Panel'}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}

        {/* Debug Role Information (remove in production) */}
        {user && __DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Info</Text>
            <View style={styles.infoCard}>
              <Text style={styles.debugText}>User ID: {user.id}</Text>
              <Text style={styles.debugText}>Profile Role: {profile?.role || 'No role'}</Text>
              <Text style={styles.debugText}>Computed Role: {userRole || 'No computed role'}</Text>
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Bell size={20} color="#6b7280" />
                </View>
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#d1d5db', true: '#c4b5fd' }}
                thumbColor={notificationsEnabled ? '#7c3aed' : '#f3f4f6'}
              />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Globe size={20} color="#6b7280" />
                </View>
                <Text style={styles.settingLabel}>Language</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>English</Text>
                <ChevronRight size={20} color="#9ca3af" />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Lock size={20} color="#6b7280" />
                </View>
                <Text style={styles.settingLabel}>Privacy & Security</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/privacy-security')}>
                <ChevronRight size={20} color="#9ca3af" />
              </TouchableOpacity>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/help-support')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <HelpCircle size={20} color="#6b7280" />
                </View>
                <Text style={styles.settingLabel}>Help & Support</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/contact')}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <MessageCircle size={20} color="#6b7280" />
                </View>
                <Text style={styles.settingLabel}>Contact Us</Text>
              </View>
              <ChevronRight size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: 56,   // ⬅️ slightly more bottom padding
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  headerWeb: {
    paddingTop: 20,
  },
  headerContent: {
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,  
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#fee2e2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  loginPromptButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  loginPromptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginLeft: 12,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
    marginRight: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guestUserName: {
  color: '#111827',
},

guestUserEmail: {
  color: '#6b7280',
},

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  debugText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});
