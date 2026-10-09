import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyAnCtbA0uGizRXeHPQ1tiOJKKmXOQQukBs',
  authDomain: 'dalan-7816f.firebaseapp.com',
  projectId: 'dalan-7816f',
  storageBucket: 'dalan-7816f.firebasestorage.app',
  messagingSenderId: '129442564816',
  appId: '1:129442564816:web:fb7f09d156bbc4c8e66cd5',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createDb() {
  try {
    return initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    return getFirestore(app);
  }
}

function createAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export { app };
export const db = createDb();
export const auth = createAuth();
export const storage = getStorage(app);
