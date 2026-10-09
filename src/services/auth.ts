import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { Platform } from 'react-native';

import { auth } from '../../firebase';

const GOOGLE_WEB_CLIENT_ID = '129442564816-7ubgbgis5fide1ek5t7ap7ge8lnsmrjh.apps.googleusercontent.com';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerId: string | null;
};

export function asAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isAnonymous: user.isAnonymous,
    providerId: user.providerData[0]?.providerId ?? (user.isAnonymous ? 'anonymous' : null),
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

export async function signInWithGoogle() {
  if (Platform.OS === 'web') {
    const { signInWithPopup } = await import('firebase/auth');
    await signInWithPopup(auth, new GoogleAuthProvider());
    return;
  }

  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  if (Platform.OS === 'android') {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }
  const result = await GoogleSignin.signIn();
  if (result.type !== 'success') return;
  const idToken = result.data.idToken;
  if (!idToken) {
    throw new Error('Google did not return a sign-in token.');
  }
  await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
}

export async function signOutUser() {
  if (Platform.OS !== 'web') {
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      await GoogleSignin.signOut();
    } catch {
      // Email accounts have no Google session to clear.
    }
  }
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
    return 'This sign-in method is not enabled yet in Firebase Authentication.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'That email already uses a password. Sign in with email instead.';
  }
  if (code === 'SIGN_IN_CANCELLED' || code === '12501') return '';
  if (code === 'PLAY_SERVICES_NOT_AVAILABLE') {
    return 'Google Play Services is not available on this device.';
  }
  if (code === '10' || code === 'DEVELOPER_ERROR') {
    return 'Google sign-in is not ready for this build yet. Rebuild the app and try again.';
  }
  if (error instanceof Error && /RNGoogleSignin|native module/i.test(error.message)) {
    return 'Google sign-in needs a fresh app build. Rebuild the Android app, then try again.';
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Could not continue. Try again.';
}
