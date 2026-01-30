import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, Share, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useRouter, useRootNavigationState } from 'expo-router'; // <--- Added useRootNavigationState
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const [items, setItems] = useState([]);
  const router = useRouter();
  const user = auth.currentUser;
  
  // 1. Get the navigation state to check if the app is ready
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // 2. Guard clause: If navigation isn't ready yet, stop here.
    if (!rootNavigationState?.key) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Query filters items by userId to ensure privacy
    const q = query(
      collection(db, "items"),
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(itemsData);
    });

    return () => unsubscribe();
  }, [user, rootNavigationState?.key]); // <--- Added dependency here

  // 3. Loading Spinner: Shows while waiting for Navigation or User check
  // This prevents the "Rendered too fast" crash
  if (!rootNavigationState?.key || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  const openLink = (url) => {
    if (url) {
      Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    } else {
      alert("No link saved for this item.");
    }
  };

  const shareItem = async (title, url) => {
    try {
      await Share.share({
        message: `Check out this item: ${title} - ${url || ''}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        {item.url ? <Text style={styles.urlText} numberOfLines={1}>{item.url}</Text> : null}
      </View>
      
      <View style={styles.iconContainer}>
        {/* Link Icon */}
        <TouchableOpacity onPress={() => openLink(item.url)} style={styles.iconButton}>
          <Ionicons name="link-outline" size={24} color="#007AFF" />
        </TouchableOpacity>

        {/* Share Icon */}
        <TouchableOpacity onPress={() => shareItem(item.title, item.url)} style={styles.iconButton}>
          <Ionicons name="share-social-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vault</Text>
        <TouchableOpacity onPress={() => auth.signOut().then(() => router.replace('/login'))}>
          <Ionicons name="log-out-outline" size={24} color="red" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add')}>
        <Ionicons name="add" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  list: { padding: 20 },
  card: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2
  },
  textContainer: { flex: 1 },
  title: { fontSize: 18, fontWeight: '600' },
  urlText: { fontSize: 12, color: 'gray', marginTop: 2 },
  iconContainer: { flexDirection: 'row', gap: 15, marginLeft: 10 },
  iconButton: { padding: 5 },
  fab: {
    position: 'absolute', bottom: 30, right: 30,
    backgroundColor: '#007AFF', width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4
  }
});