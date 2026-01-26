import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// We export these initialized instances to use throughout the app
export const FIREBASE_AUTH = auth();
export const FIREBASE_DB = firestore();