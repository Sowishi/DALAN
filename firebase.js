import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyAnCtbA0uGizRXeHPQ1tiOJKKmXOQQukBs',
  authDomain: 'dalan-7816f.firebaseapp.com',
  projectId: 'dalan-7816f',
  storageBucket: 'dalan-7816f.firebasestorage.app',
  messagingSenderId: '129442564816',
  appId: '1:129442564816:web:fb7f09d156bbc4c8e66cd5',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export { app };
export const db = getFirestore(app);
