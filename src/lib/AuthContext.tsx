import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { setupPushNotifications } from './notifications';

interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin';
  displayName?: string;
  points?: number;
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Initialize push notifications
        setupPushNotifications(firebaseUser.uid);

        // Listen to profile changes in real-time
        const docRef = doc(db, 'users', firebaseUser.uid);

        // Clean up previous profile listener if it exists
        if (profileUnsubscribe) {
          profileUnsubscribe();
        }

        profileUnsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create default profile if it doesn't exist
            const isAdminEmail = firebaseUser.email?.toLowerCase().trim() === 'idemudiawisdom27@gmail.com' ||
                               firebaseUser.email === import.meta.env.VITE_ADMIN_EMAIL;

            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isAdminEmail ? 'admin' : 'user',
              points: 100,
              tier: 'Bronze',
            };
            setDoc(docRef, newProfile).catch(err => console.error("Error creating profile:", err));
            setProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile snapshot error:", error);
          if (error.code === 'permission-denied') {
             // Fallback for immediate access if rules are being updated
             const isAdminEmail = firebaseUser.email?.toLowerCase().trim() === 'idemudiawisdom27@gmail.com';
             setProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: isAdminEmail ? 'admin' : 'user',
                points: 0
             });
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
        if (profileUnsubscribe) {
          profileUnsubscribe();
          profileUnsubscribe = null;
        }
      }
    });

    return () => {
      authUnsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const value = React.useMemo(() => ({
    user,
    profile,
    loading,
    isAdmin: (profile?.role === 'admin') ||
             (user?.email?.toLowerCase().trim() === 'idemudiawisdom27@gmail.com') ||
             (profile?.email?.toLowerCase().trim() === 'idemudiawisdom27@gmail.com') ||
             (user?.email === import.meta.env.VITE_ADMIN_EMAIL) ||
             (profile?.email === import.meta.env.VITE_ADMIN_EMAIL)
  }), [user, profile, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
