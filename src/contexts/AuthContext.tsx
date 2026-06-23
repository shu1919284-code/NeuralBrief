import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '../lib/firebase';

/** Shape of a Firebase Auth error object (subset we care about). */
interface FirebaseAuthError {
  code?: string;
  message?: string;
}

/** Values exposed by AuthContext. */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  popupBlocked: boolean;
  authError: string | null;
  /** True when this is the user's first ever sign-in (no Firestore doc existed). */
  isNewUser: boolean;
  /** True when the user has completed the onboarding flow. */
  onboardingComplete: boolean;
  signIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
  /** Call this after onboarding is dismissed (completed or skipped) to update local state. */
  markOnboardingSeen: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  popupBlocked: false,
  authError: null,
  isNewUser: false,
  onboardingComplete: true,
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  clearAuthError: () => {},
  markOnboardingSeen: () => {},
});

/** Returns true when the Firebase error code indicates a blocked / closed popup. */
function isPopupBlocked(err: FirebaseAuthError): boolean {
  return (
    err.code === 'auth/popup-blocked' ||
    err.code === 'auth/cancelled-popup-request' ||
    (typeof err.message === 'string' && err.message.includes('popup'))
  );
}

/**
 * Creates a Firestore document for a brand-new user.
 * Returns { created: true } if the doc was newly created, { created: false } if it already existed.
 * Also returns the current onboardingComplete value from the doc.
 */
async function createUserDocIfAbsent(
  user: User,
): Promise<{ created: boolean; onboardingComplete: boolean }> {
  const ref = doc(db, 'users', user.uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      memberSince: serverTimestamp(),
      topics: [],
      digestFrequency: 'daily',
      isAdmin: false,
      onboardingComplete: false,
      onboardingSkipped: false,
    });
    return { created: true, onboardingComplete: false };
  }

  const data = snapshot.data();
  return {
    created: false,
    onboardingComplete: data?.onboardingComplete ?? false,
  };
}

/**
 * Provides Firebase authentication state and helpers to the component tree.
 * Handles popup-blocked detection, first-login Firestore user document creation,
 * and onboarding state tracking.
 */
export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [user, setUser]                         = useState<User | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [popupBlocked, setPopupBlocked]         = useState(false);
  const [authError, setAuthError]               = useState<string | null>(null);
  const [isNewUser, setIsNewUser]               = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const { created, onboardingComplete: completed } = await createUserDocIfAbsent(firebaseUser);
          setIsNewUser(created);
          setOnboardingComplete(completed);
        } catch {
          // Non-fatal: auth state is still valid even if Firestore write fails.
          setIsNewUser(false);
          setOnboardingComplete(true);
        }
      } else {
        setIsNewUser(false);
        setOnboardingComplete(true);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /**
   * Initiates a Google sign-in popup flow.
   * Sets `popupBlocked` and `authError` if the browser blocks the popup.
   */
  const signIn = async (): Promise<void> => {
    setAuthError(null);
    setPopupBlocked(false);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const firebaseErr = err as FirebaseAuthError;
      if (isPopupBlocked(firebaseErr)) {
        setPopupBlocked(true);
        setAuthError('Sign-in popup was blocked. Please allow popups for this site and try again.');
      } else {
        setAuthError('Google sign-in failed. Please try again.');
      }
    }
  };

  /** Signs the current user out and resets any auth error state. */
  const signOut = async (): Promise<void> => {
    setAuthError(null);
    try {
      await firebaseSignOut(auth);
    } catch {
      setAuthError('Sign-out failed. Please refresh and try again.');
    }
  };

  /** Clears any stored auth error message. */
  const clearAuthError = (): void => {
    setAuthError(null);
    setPopupBlocked(false);
  };

  /**
   * Called after the onboarding modal is dismissed (completed or skipped).
   * Prevents the modal from re-rendering after state updates.
   */
  const markOnboardingSeen = (): void => {
    setIsNewUser(false);
    // Don't set onboardingComplete here — let Firestore be the source of truth.
    // The modal handles its own visibility via localStorage session count for skippers.
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        popupBlocked,
        authError,
        isNewUser,
        onboardingComplete,
        signIn,
        signInWithGoogle: signIn,
        signOut,
        clearAuthError,
        markOnboardingSeen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/** Hook to consume AuthContext. Must be used inside AuthProvider. */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;