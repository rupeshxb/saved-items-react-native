import { Slot, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
// 👇 IMPORT TYPES AND FUNCTION DIRECTLY
import { onAuthStateChanged, FirebaseAuthTypes } from '@react-native-firebase/auth';
import { FIREBASE_AUTH } from '../src/core/services/firebase';

export default function RootLayout() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // 👇 NEW MODULAR SYNTAX
    const subscriber = onAuthStateChanged(FIREBASE_AUTH, (userState) => {
      setUser(userState);
      if (initializing) setInitializing(false);
    });
    return subscriber;
  }, []);

  useEffect(() => {
    if (initializing || !navigationState?.key) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (user && inAuthGroup) {
      router.replace('/');
    } else if (!user && !inAuthGroup) {
      router.replace('/login');
    }
  }, [user, initializing, segments, navigationState?.key]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Slot />
    </View>
  );
}