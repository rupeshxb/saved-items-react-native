import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, StatusBar } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ItemRepository } from '../services/ItemRepository';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function EditItemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const itemId = params.id as string;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!itemId) return;
    loadItemData();
  }, [itemId]);

  const loadItemData = async () => {
    try {
        const docRef = doc(db, 'items', itemId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            setTitle(data.title);
            setDescription(data.description);
            setUrl(data.url);
        } else {
            Alert.alert("Error", "Item not found");
            router.back();
        }
    } catch (e) {
        Alert.alert("Error", "Could not load item");
    } finally {
        setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!title || !description) {
      Alert.alert("Missing Info", "Please enter a title and description.");
      return;
    }

    setSaving(true);
    try {
      await ItemRepository.updateItem(itemId, {
          title,
          description,
          url,
          updatedAt: new Date()
      });
      Alert.alert("Success", "Item updated!");
      router.back(); 
    } catch (error: any) {
      Alert.alert("Error", "Could not update: " + error.message);
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#0288D1"/></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0288D1" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Secret</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* FORM */}
      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Secret / Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />
        </View>

        <View style={styles.inputGroup}>
            <Text style={styles.label}>Relevant Link</Text>
            <TextInput style={styles.input} value={url} onChangeText={setUrl} autoCapitalize="none"/>
        </View>

        <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleUpdate} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F9FF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#0288D1', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 4 },
  backBtn: { padding: 5 },
  backText: { fontSize: 28, color: '#fff', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, color: '#fff', fontWeight: 'bold' },
  formContainer: { padding: 25 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, color: '#0288D1', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#CFD8DC', borderRadius: 8, padding: 15, fontSize: 16, color: '#333' },
  textArea: { height: 120, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#0288D1', paddingVertical: 18, borderRadius: 10, alignItems: 'center', marginTop: 10, elevation: 3 },
  saveBtnDisabled: { backgroundColor: '#B0BEC5' },
  saveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});