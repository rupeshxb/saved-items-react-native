import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence, 
  getAuth 
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyB9X70-R92O2cQcHaMIpPxiBR2afXePCZc",
  authDomain: "saved-items-vault-react-native.firebaseapp.com",
  projectId: "saved-items-vault-react-native",
  storageBucket: "saved-items-vault-react-native.firebasestorage.app",
  messagingSenderId: "1025773661822",
  appId: "1:1025773661822:web:220816c0e45348049db22f",
  measurementId: "G-RYZ49HLBLY"
};

// 1. Initialize App (Singleton Pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Initialize Auth with Persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

// 3. Initialize Firestore (Safe Pattern)
let db;
try {
    // Try to initialize with custom settings (Offline Persistence & Stability)
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
    });
} catch (e) {
    // If already initialized, just grab the existing instance
    // This ignores the custom settings but prevents the app from crashing during hot reloads
    db = getFirestore(app);
}

export { auth, db };