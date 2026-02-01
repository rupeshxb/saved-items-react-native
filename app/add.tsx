import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  StatusBar 
} from 'react-native';
import { useRouter, Stack } from 'expo-router'; // <--- Added Stack import
import { ItemRepository } from '../services/ItemRepository';

export default function AddItemScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title || !description) {
      Alert.alert("Missing Info", "Please enter a title and description.");
      return;
    }

    setLoading(true);
    try {
      await ItemRepository.createItem(title, description, url);
      router.back(); 
    } catch (error: any) {
      Alert.alert("Error", "Could not save item: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* THIS LINE HIDES THE SYSTEM HEADER */}
      <Stack.Screen options={{ headerShown: false }} />

      <StatusBar barStyle="light-content" backgroundColor="#0288D1" />
      
      {/* CUSTOM HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Item</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* FORM CONTAINER */}
      <View style={styles.formContainer}>
        <Text style={styles.helperText}>
            Securely store a password, note, or sensitive link in your vault.
        </Text>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput 
                style={styles.input} 
                placeholder="e.g., Netflix Password" 
                placeholderTextColor="#B0BEC5"
                value={title}
                onChangeText={setTitle}
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Secret / Description</Text>
            <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Enter your secret details here..." 
                placeholderTextColor="#B0BEC5"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
            />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Relevant Link (Optional)</Text>
            <TextInput 
                style={styles.input} 
                placeholder="https://..." 
                placeholderTextColor="#B0BEC5"
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
            />
        </View>

        <TouchableOpacity 
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
            onPress={handleCreate}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.saveBtnText}>Lock in Vault</Text>
            )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F9FF' },
  
  header: { 
    backgroundColor: '#0288D1', 
    paddingTop: 60, 
    paddingBottom: 20, 
    paddingHorizontal: 20, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    elevation: 4 
  },
  backBtn: { padding: 5 },
  backText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },

  formContainer: { padding: 25 },
  helperText: { color: '#546E7A', marginBottom: 25, lineHeight: 20 },
  
  inputGroup: { marginBottom: 20 },
  label: { 
    fontSize: 12, 
    color: '#0288D1', 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    marginBottom: 8 
  },
  input: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#CFD8DC', 
    borderRadius: 8, 
    padding: 15, 
    fontSize: 16, 
    color: '#333' 
  },
  textArea: { height: 120 },

  saveBtn: { 
    backgroundColor: '#0288D1', 
    paddingVertical: 18, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  saveBtnDisabled: { backgroundColor: '#B0BEC5' },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});