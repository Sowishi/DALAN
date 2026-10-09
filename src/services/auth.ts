import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import { auth } from '../../firebase';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
};

export function asAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
  };
}

export function subscribeAuth(onChange: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (user) => onChange(asAuthUser(user)));
}

export async function signInWithEmail(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const displayName = name.trim();
  if (displayName) {
    await updateProfile(credential.user, { displayName });
  }
}

export async function continueAsGuest() {
  await signInAnonymously(auth);
}

export async function signOutUser() {
  await signOut(auth);
}

export function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'Incorrect email or password.';
  }
  if (code === 'auth/email-already-in-use') return 'That email is already registered. Sign in instead.';
  if (code === 'auth/weak-password') return 'Use at least 6 characters for your password.';
  if (code === 'auth/network-request-failed') return 'Check your connection and try again.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later.';
  if (code === 'auth/operation-not-allowed') {
    return 'Email sign-in is not enabled yet in Firebase Authentication.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Could not continue. Try again.';
}
