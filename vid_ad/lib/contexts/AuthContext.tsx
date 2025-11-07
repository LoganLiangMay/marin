'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  UserCredential,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, firestore as db } from '@/lib/firebase/config';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

// TypeScript interfaces
interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastLogin: Date;
  metadata?: Record<string, any>;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signup: (email: string, password: string, displayName?: string) => Promise<UserCredential>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearError: () => void;
  checkSessionExpiry: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user profile in Firestore
  const createUserProfile = async (user: User, additionalData?: Partial<UserProfile>) => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData?.displayName || null,
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLogin: new Date(),
        ...additionalData
      };

      try {
        await setDoc(userRef, {
          ...profile,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
        setUserProfile(profile);
      } catch (err) {
        console.error('Error creating user profile:', err);
        setError('Failed to create user profile');
      }
    } else {
      // Update last login
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      const data = snapshot.data();
      setUserProfile({
        uid: user.uid,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        createdAt: data.createdAt?.toDate(),
        lastLogin: data.lastLogin?.toDate(),
        metadata: data.metadata
      });
    }
  };

  // Signup function
  const signup = async (email: string, password: string, displayName?: string) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      // Create user profile in Firestore
      await createUserProfile(result.user, { displayName });

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Login function with remember me option
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    setError(null);
    try {
      // Set persistence based on remember me option
      // If remember me is true, use LOCAL persistence (30 days)
      // If false, use SESSION persistence (until browser closes)
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);

      const result = await signInWithEmailAndPassword(auth, email, password);

      // Update user profile last login
      if (result.user) {
        await createUserProfile(result.user);

        // Store session start time for 30-day expiry tracking
        if (rememberMe) {
          localStorage.setItem('sessionStartTime', new Date().toISOString());
        }
      }

      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
      setUserProfile(null);
      // Clear session data
      localStorage.removeItem('sessionStartTime');
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Check if session has expired (30 days)
  const checkSessionExpiry = () => {
    const sessionStartTime = localStorage.getItem('sessionStartTime');
    if (sessionStartTime && currentUser) {
      const startDate = new Date(sessionStartTime);
      const now = new Date();
      const daysDifference = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      // If more than 30 days have passed, force logout
      if (daysDifference > 30) {
        logout();
        setError('Your session has expired after 30 days. Please log in again.');
      }
    }
  };

  // Reset password function
  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) {
      setError('No user logged in');
      return;
    }

    setError(null);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, data);

      // Update local state
      setUserProfile(prev => prev ? { ...prev, ...data } : null);

      // Update Firebase Auth profile if displayName or photoURL changed
      if (data.displayName !== undefined || data.photoURL !== undefined) {
        await updateProfile(currentUser, {
          displayName: data.displayName || currentUser.displayName,
          photoURL: data.photoURL || currentUser.photoURL
        });
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Set up auth state listener and session expiry checker
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Get user profile from Firestore
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserProfile({
            uid: user.uid,
            email: data.email,
            displayName: data.displayName,
            photoURL: data.photoURL,
            createdAt: data.createdAt?.toDate(),
            lastLogin: data.lastLogin?.toDate(),
            metadata: data.metadata
          });
        } else {
          // Create profile if it doesn't exist
          await createUserProfile(user);
        }

        // Check session expiry on auth state change
        checkSessionExpiry();
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    // Set up interval to check session expiry every hour
    const intervalId = setInterval(() => {
      checkSessionExpiry();
    }, 60 * 60 * 1000); // Check every hour

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    error,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    clearError,
    checkSessionExpiry
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}