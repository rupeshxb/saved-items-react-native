import { View, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ItemRepository } from '../services/ItemRepository'; // Import Repo

export default function AddItemScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Title is required');
      return;
    }

    // Basic URL validation
    if (url && !url.startsWith('http')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }

    setSaving(true);
    try {
      // USE REPOSITORY INSTEAD OF DIRECT FIRESTORE CALLS
      await ItemRepository.createItem(title, url);
      
      Alert.alert('Success', 'Item saved!');
      router.back(); // Go back to Home
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        placeholder="URL (optional)"
        value={url}
        onChangeText={setUrl}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="url"
      />
      
      {saving ? (
        <ActivityIndicator size="small" color="#0000ff" />
      ) : (
        <Button title="Save Item" onPress={handleSave} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
});