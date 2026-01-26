import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, addDoc } from '@react-native-firebase/firestore';
import { FIREBASE_DB, FIREBASE_AUTH } from '../src/core/services/firebase';

export default function AddItem() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name || !desc) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      const user = FIREBASE_AUTH.currentUser;
      
      await addDoc(collection(FIREBASE_DB, 'items'), {
        name: name,
        description: desc,
        createdBy: user?.uid, // Keep track of who made it
        // 👇 NEW: Everyone in this list can see the item
        sharedWith: [user?.email], 
        createdAt: new Date().toISOString(),
      });
      
      Alert.alert('Success', 'Item Saved!');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add New Item</Text>
      <TextInput style={styles.input} placeholder="Item Name" value={name} onChangeText={setName} />
      <TextInput style={styles.area} placeholder="Description" value={desc} onChangeText={setDesc} multiline />
      <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Item</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff', justifyContent: 'center' },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1F2937' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', padding: 16, borderRadius: 12, marginBottom: 16, fontSize: 16, backgroundColor: '#F9FAFB' },
  area: { borderWidth: 1, borderColor: '#E5E7EB', padding: 16, borderRadius: 12, marginBottom: 24, fontSize: 16, height: 120, textAlignVertical: 'top', backgroundColor: '#F9FAFB' },
  btn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});