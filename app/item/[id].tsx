import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { FIREBASE_DB } from '../../src/core/services/firebase';

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const docRef = doc(FIREBASE_DB, 'items', id as string);
    
    // 👇 FIX: Removed explicit type to let TS infer correctly, and added ()
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) { 
        setItem(docSnap.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!item) return <View style={styles.center}><Text>Item not found!</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Shared Item:</Text>
      <Text style={styles.title}>{item.name}</Text>
      <View style={styles.card}>
        <Text style={styles.desc}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6', justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 16, color: '#666', marginBottom: 5, textAlign: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 3 },
  desc: { fontSize: 18, lineHeight: 26, color: '#333' }
});