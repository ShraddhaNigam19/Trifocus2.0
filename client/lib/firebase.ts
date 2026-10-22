import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Check if Firebase environment variables are configured
const isFirebaseConfigured = () => {
  const requiredEnvVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
  ];

  return requiredEnvVars.every(envVar => import.meta.env[envVar]);
};

// Your web app's Firebase configuration (only used when properly configured)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if properly configured
let app: any = null;
let db: any = null;
let auth: any = null;
let provider: any = null;

if (isFirebaseConfigured()) {
  try {
    // Initialize Firebase only with real config
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    db = getFirestore(app);
    console.log('🔥 Firebase: Initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    app = null;
    auth = null;
    provider = null;
    db = null;
  }
} else {
  console.log('🔥 Firebase: Using demo mode (no Firebase initialization)');
}

export { db, auth, provider };

export const isUsingDemoConfig = !isFirebaseConfigured();
