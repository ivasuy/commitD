"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { auth, firestore, googleProvider } from "@/src/lib/firebase/client";
import { migrateLocalStorageToFirestore } from "@/src/lib/db/migrate";
import { loadUserProfile, type UserProfile } from "@/src/lib/db/profile";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function ensureUserProfile(user: User): Promise<void> {
  const provider = user.providerData[0]?.providerId ?? "password";
  const userRef = doc(firestore, "users", user.uid);
  const existingProfile: UserProfile = await loadUserProfile(user.uid).catch(
    () => ({} as UserProfile),
  );
  const profilePatch: Record<string, unknown> = {
    email: user.email ?? "",
    provider,
    lastActiveAt: serverTimestamp(),
  };

  if (existingProfile.createdAt === undefined || existingProfile.createdAt === null) {
    const createdAtFromAuth = user.metadata.creationTime
      ? new Date(user.metadata.creationTime)
      : null;

    profilePatch.createdAt =
      createdAtFromAuth && !Number.isNaN(createdAtFromAuth.getTime())
        ? createdAtFromAuth
        : serverTimestamp();
  }

  await setDoc(
    userRef,
    {
      profile: profilePatch,
    },
    { merge: true },
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);

      if (nextUser) {
        void ensureUserProfile(nextUser);
        void migrateLocalStorageToFirestore(nextUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithEmail: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signUpWithEmail: async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
      },
      signInWithGoogle: async () => {
        await signInWithPopup(auth, googleProvider);
      },
      signOut: async () => {
        await firebaseSignOut(auth);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }

  return context;
}
