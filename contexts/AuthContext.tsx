import {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from 'react';

import { Session, User } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

/* =======================
   Types
======================= */

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

/* =======================
   Context
======================= */

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

/* =======================
   Hook
======================= */

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

/* =======================
   Provider
======================= */

export function AuthProvider({ children }: PropsWithChildren<{}>) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log(
          'Auth state changed:',
          _event,
          session?.user?.email
        );

        setSession(session);

        if (session?.user) {
          await loadProfile();
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  /* =======================
     Load Profile
  ======================= */

  const loadProfile = async () => {
    if (!session?.user) return;

    try {
      console.log(
        'Loading profile for user:',
        session.user.email
      );

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(
          'id, email, full_name, avatar_url, created_at, role'
        )
        .eq('id', session.user.id)
        .single();

      if (!error && profileData) {
        console.log('Profile loaded:', profileData);
        setProfile(profileData);
      } else {
        console.error('Profile fetch error:', error);
        setProfile(null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  /* =======================
     Sign Out
  ======================= */

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
