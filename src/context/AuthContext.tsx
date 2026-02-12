
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth as useFirebaseAuth, useUser, useFirestore } from '@/firebase';
import { UserProfile } from '@/lib/types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (collegeId: string, password: string) => Promise<void>;
  register: (data: Omit<UserProfile, 'id' | 'authEmail' | 'currentSemester'>, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DUMMY_DOMAIN = "students.attendease.local";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useFirebaseAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (user && db) {
        setIsProfileLoading(true);
        try {
          const docRef = doc(db, 'studentProfiles', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } catch (error) {
          setProfile(null);
        } finally {
          setIsProfileLoading(false);
        }
      } else {
        setProfile(null);
      }
    }
    fetchProfile();
  }, [user, db]);

  const login = async (collegeId: string, password: string) => {
    const authEmail = `${collegeId.toLowerCase()}@${DUMMY_DOMAIN}`;
    await signInWithEmailAndPassword(auth, authEmail, password);
  };

  const register = async (data: Omit<UserProfile, 'id' | 'authEmail' | 'currentSemester'>, password: string) => {
    const authEmail = `${data.collegeId.toLowerCase()}@${DUMMY_DOMAIN}`;
    
    // 1. Create the Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, authEmail, password);
    const newUser = userCredential.user;

    await updateProfile(newUser, { displayName: data.name });

    const newProfile: UserProfile = {
      ...data,
      id: newUser.uid,
      authEmail: authEmail,
      currentSemester: 2,
    };

    // 2. Create the Firestore profile
    const profileRef = doc(db, 'studentProfiles', newUser.uid);
    await setDoc(profileRef, {
      ...newProfile,
      createdAt: serverTimestamp()
    });

    // 3. Immediately sign out to prevent auto-login
    await signOut(auth);
    setProfile(null);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading: isUserLoading || isProfileLoading, 
      login, 
      register, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
