import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig';

export default function AddItem() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const saveItem = async () => {
    if (title.trim() === '') {
      Alert.alert("Error", "Please enter a title");
      return;
    }
    
    try {
      if (!auth.currentUser) {
        Alert.alert("Error", "You must be logged in");
        return;
      }

      await addDoc(collection(db, "items"), {
        title: title,
        url: url, // Saving the link
        userId: auth.currentUser.uid, // <--- CRITICAL: Ties item to THIS user
        createdAt: serverTimestamp()
      });
      router.back();
    } catch (e) {
      console.error("Error adding document: ", e);
      Alert.alert("Error", "Could not save item");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add to Vault</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Item Title (e.g., My Portfolio)" 
        value={title} 
        onChangeText={setTitle} 
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Link / URL (optional)" 
        value={url} 
        onChangeText={setUrl}
        autoCapitalize="none"
        keyboardType="url"
      />
      
      <TouchableOpacity style={styles.button} onPress={saveItem}>
        <Text style={styles.buttonText}>Save Item</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#f5f5f5' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});