import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from '@react-native-firebase/auth';
// 👇 FIX: Import FirebaseFirestoreTypes
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { FIREBASE_AUTH, FIREBASE_DB } from '../src/core/services/firebase';

interface Item {
  id: string;
  name: string;
  description: string;
  sharedWith: string[];
}

export default function Dashboard() {
  const router = useRouter();
  const user = FIREBASE_AUTH.currentUser;
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Share Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [emailToShare, setEmailToShare] = useState('');

  // 👇 ADDED: Separate function to handle sharing logic
  const handleShareSubmit = async () => {
    if (!selectedItemId || !emailToShare) return;

    try {
      const itemRef = doc(FIREBASE_DB, 'items', selectedItemId);
      await updateDoc(itemRef, {
        sharedWith: arrayUnion(emailToShare.toLowerCase().trim())
      });
      Alert.alert("Success", `Shared with ${emailToShare}`);
      setModalVisible(false);
      setEmailToShare('');
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const openShareModal = (id: string) => {
    setSelectedItemId(id);
    setModalVisible(true);
  };

  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(FIREBASE_DB, 'items'), 
      where('sharedWith', 'array-contains', user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Item[] = [];
      // 👇 FIX: Added type here (QueryDocumentSnapshot)
      snapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        list.push({ ...doc.data(), id: doc.id } as Item);
      });
      setItems(list);
      setLoading(false);
    }, (error) => {
      console.error(error);
      Alert.alert("Error", "Could not load items.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut(FIREBASE_AUTH);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Items</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add')}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
              
              <View style={styles.row}>
                <TouchableOpacity onPress={() => router.push(`/item/${item.id}`)}>
                  <Text style={styles.linkText}>View Details</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareBtn} onPress={() => openShareModal(item.id)}>
                  <Text style={styles.shareText}>📤 Share Access</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.sharedCount}>
                Shared with {item.sharedWith ? item.sharedWith.length : 1} people
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>No items yet.</Text>}
        />
      )}

      {/* Share Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share Item</Text>
            <Text style={styles.modalSub}>Enter user email to grant access:</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="friend@email.com" 
              value={emailToShare}
              onChangeText={setEmailToShare}
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareSubmit} style={styles.confirmBtn}>
                <Text style={styles.confirmText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 14, color: '#666' },
  addBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5, color: '#1F2937' },
  cardDesc: { fontSize: 14, color: '#4B5563', marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  linkText: { color: '#2563EB', fontWeight: '600' },
  shareBtn: { backgroundColor: '#EFF6FF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  shareText: { color: '#2563EB', fontWeight: 'bold', fontSize: 12 },
  sharedCount: { fontSize: 10, color: '#999', marginTop: 10, textAlign: 'right' },
  empty: { textAlign: 'center', marginTop: 50, color: '#9CA3AF', fontSize: 16 },
  logoutBtn: { position: 'absolute', bottom: 30, left: 20, right: 20, backgroundColor: '#EF4444', padding: 15, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: 'white', padding: 20, borderRadius: 16, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#666', fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#2563EB', padding: 10, borderRadius: 8 },
  confirmText: { color: 'white', fontWeight: 'bold' }
});