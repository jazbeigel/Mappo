import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export const requiredFirebaseKeys = Object.keys(firebaseConfig);

export const isFirebaseConfigValid = requiredFirebaseKeys.every(
  (key) => typeof firebaseConfig[key] === 'string' && firebaseConfig[key].length > 0
);

let appInstance;

export function getFirebaseApp() {
  if (!isFirebaseConfigValid) {
    throw new Error('Firebase no está configurado correctamente.');
  }

  if (!appInstance) {
    const apps = getApps();
    appInstance = apps.length ? apps[0] : initializeApp(firebaseConfig);
  }

  return appInstance;
}

export function getFirebaseStorage() {
  return getStorage(getFirebaseApp());
}

export function getFirestoreInstance() {
  return getFirestore(getFirebaseApp());
}
