import { initializeApp, getApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyB9X70-R92O2cQcHaMIpPxiBR2afXePCZc",
  authDomain: "saved-items-vault-react-native.firebaseapp.com",
  projectId: "saved-items-vault-react-native",
  storageBucket: "saved-items-vault-react-native.firebasestorage.app",
  messagingSenderId: "1025773661822",
  appId: "1:1025773661822:web:220816c0e45348049db22f",
  measurementId: "G-RYZ49HLBLY"
};

let app;
let auth;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } else {
    app = getApp();
    auth = getAuth(app);
  }
} catch (error) {
  console.log("Error initializing Firebase:", error);
}

const db = getFirestore(app);

export { auth, db };