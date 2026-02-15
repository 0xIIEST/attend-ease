
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/lib/types';
import { api } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Keeping for now if needed for custom token sign-in, else remove
import { signInWithCustomToken, signOut, User, onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => void;
  completeRegistration: (data: Omit<UserProfile, 'id' | 'authEmail' | 'currentSemester'>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();


  // Handle Firebase Auth State Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch profile from backend
        try {
          const profileData = await api.students.getProfile(currentUser.uid);
          setProfile(profileData as UserProfile);
        } catch (err) {
          console.error("Profile not found or error:", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Handle Token from URL (after backend redirect)
  // We need a component to wrap this logic because useSearchParams is a hook
  // Ideally this should be in a separate layout or component, but doing it here for simplicity
  // Note: In Next.js App Router, this might not work inside a Context directly if not wrapped in Suspense
  // For now, we assume the user lands on a page that handles the token, 
  // OR we check window.location.search here since we are in "use client"

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (token) {
        signInWithCustomToken(auth, token).then(() => {
          // Clear the token from URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }).catch(err => {
          console.error("Failed to sign in with custom token", err);
        });
      }
    }
  }, []);

  const loginWithGoogle = () => {
    api.auth.login();
  };

  const completeRegistration = async (data: Omit<UserProfile, 'id' | 'authEmail' | 'currentSemester'>) => {
    if (!user) throw new Error("No user authenticated");

    // Create profile in backend
    const newProfile = {
      ...data,
      id: user.uid,
      authEmail: user.email || "",
      currentSemester: 2,
      name: user.displayName || data.name,
    };

    await api.students.createProfile(user.uid, newProfile);
    setProfile(newProfile as UserProfile);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      loginWithGoogle,
      completeRegistration,
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
