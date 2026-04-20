import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasFirebaseKeys = firebaseConfig.apiKey && firebaseConfig.appId;

if (!hasFirebaseKeys) {
  console.error("❌ FIREBASE KEYS MISSING! Google Login will not work. Add them to your Render Environment Variables.");
}

// Initialize Firebase
const app = hasFirebaseKeys ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : (null as any);

export { app, auth };
