import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, StyleSheet, TouchableOpacity, 
  Alert, ActivityIndicator, ScrollView, StatusBar, Share 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Linking from 'expo-linking'; 
import * as Clipboard from 'expo-clipboard';
import { ItemRepository } from '../../services/ItemRepository';
import { auth } from '../../firebaseConfig';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // Link State
  const [generatedLink, setGeneratedLink] = useState('');
  
  // Email Sharing State
  const [emailInput, setEmailInput] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!id) return;
    
    // Generate the deep link for display
    setGeneratedLink(Linking.createURL(`/items/${id}`));

    // Listen to the item (Real-time)
    const unsubscribe = ItemRepository.subscribeToItem(id as string, (data) => {
      if (!data) {
        setLoading(false);
        return; 
      }
      setItem(data);
      setTitle(data.title);
      setDescription(data.description);
      setUrl(data.url || '');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  // --- GENERAL ACTIONS ---

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await ItemRepository.updateItem(id as string, { title, description, url });
      setIsEditing(false);
      Alert.alert("Success", "Item updated.");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Item", "Cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
          await ItemRepository.deleteItem(id as string);
          router.back(); 
      }}
    ]);
  };

  // --- FEATURE 1: PUBLIC LINK ---
  const handleTogglePublic = async () => {
    try {
      await ItemRepository.setPublicStatus(id as string, !item.isPublic);
    } catch (e: any) { Alert.alert("Error", e.message); }
  };

  const handleCopyLink = async () => {
    if (!item.isPublic) {
        Alert.alert("Link Private", "Please enable the public link first.");
        return;
    }
    await Clipboard.setStringAsync(generatedLink);
    Alert.alert("Copied!", "Link copied to clipboard.");
  };

  // --- FEATURE 2: EMAIL SHARING ---
  const handleAddEmail = async () => {
      if(!emailInput.includes('@')) {
          Alert.alert("Invalid Email", "Please enter a valid email.");
          return;
      }
      try {
          await ItemRepository.shareWithEmail(id as string, emailInput.trim());
          setEmailInput('');
          Alert.alert("Shared", `Access granted to ${emailInput}`);
      } catch (e: any) { Alert.alert("Error", e.message); }
  };

  const handleRemoveEmail = async (emailToRemove: string) => {
      try {
          await ItemRepository.unshareWithEmail(id as string, emailToRemove);
      } catch (e: any) { Alert.alert("Error", e.message); }
  };

  // --- RENDER ---

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0288D1" /></View>;
  if (!item) return <View style={styles.center}><Text>Item not found or access denied.</Text></View>;

  const isOwner = auth.currentUser?.uid === item?.userId;

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#0288D1" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/home')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        {isOwner && !isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        {isEditing ? (
           <View style={styles.form}>
            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} />
            <Text style={styles.label}>Secret</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline />
            <Text style={styles.label}>URL</Text>
            <TextInput style={styles.input} value={url} onChangeText={setUrl} />
            <View style={styles.actionRow}>
               <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setIsEditing(false)}><Text style={styles.btnText}>Cancel</Text></TouchableOpacity>
               <TouchableOpacity style={[styles.btn, styles.saveBtn]} onPress={handleUpdate}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.title}>{item.title}</Text>
            
            {/* ================= SHARING DASHBOARD (Owner Only) ================= */}
            {isOwner && (
              <View style={styles.shareContainer}>
                 
                 {/* 1. PUBLIC LINK SECTION */}
                 <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>🔗 PUBLIC LINK</Text>
                    <View style={styles.row}>
                        <Text style={{flex:1, color: '#555'}}>{item.isPublic ? "Link is Active" : "Link is Disabled"}</Text>
                        <TouchableOpacity onPress={handleTogglePublic} style={[styles.smBtn, {backgroundColor: item.isPublic ? '#4CAF50' : '#B0BEC5'}]}>
                            <Text style={styles.smBtnText}>{item.isPublic ? "DISABLE" : "ENABLE"}</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {item.isPublic && (
                        <View style={{marginTop: 10}}>
                             <Text style={styles.linkTextDisplay} numberOfLines={1}>{generatedLink}</Text>
                             <TouchableOpacity onPress={handleCopyLink} style={styles.copyBtn}>
                                <Text style={styles.copyBtnText}>📋 Copy Link</Text>
                             </TouchableOpacity>
                        </View>
                    )}
                 </View>

                 <View style={styles.divider} />

                 {/* 2. SPECIFIC PEOPLE SECTION */}
                 <View style={styles.sectionBlock}>
                    <Text style={styles.sectionTitle}>👥 SHARE WITH PEOPLE</Text>
                    
                    {/* Add Email Input */}
                    <View style={styles.row}>
                        <TextInput 
                            style={styles.smallInput} 
                            placeholder="friend@email.com" 
                            placeholderTextColor="#999"
                            value={emailInput}
                            onChangeText={setEmailInput}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity onPress={handleAddEmail} style={styles.addBtn}>
                            <Text style={styles.addBtnText}>ADD</Text>
                        </TouchableOpacity>
                    </View>

                    {/* List Shared Users */}
                    {item.sharedEmails && item.sharedEmails.length > 0 ? (
                        item.sharedEmails.map((email: string) => (
                            <View key={email} style={styles.userRow}>
                                <Text style={styles.userText}>{email}</Text>
                                <TouchableOpacity onPress={() => handleRemoveEmail(email)}>
                                    <Text style={styles.removeText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Not shared with anyone yet.</Text>
                    )}
                 </View>

              </View>
            )}
            {/* ================================================================== */}

            <View style={styles.card}>
              <Text style={styles.label}>SECRET:</Text>
              <Text style={styles.secretText}>{item.description}</Text>
            </View>

            {item.url ? (
               <View style={styles.card}>
                 <Text style={styles.label}>URL:</Text>
                 <Text style={styles.linkText} onPress={() => Linking.openURL(item.url)}>
                   {item.url}
                 </Text>
               </View>
            ) : null}
            
            {isOwner && (
               <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteText}>Delete Item</Text>
               </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F9FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#0288D1', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 4 },
  backBtn: { padding: 5 },
  backText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  editText: { fontSize: 18, color: '#fff', fontWeight: 'bold' },
  contentContainer: { padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
  label: { fontSize: 12, color: '#888', fontWeight: 'bold', marginBottom: 5 },
  secretText: { fontSize: 18, color: '#333', lineHeight: 26 },
  linkText: { fontSize: 16, color: '#0288D1', textDecorationLine: 'underline' },
  form: { marginTop: 10 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5 },
  cancelBtn: { backgroundColor: '#90A4AE' },
  saveBtn: { backgroundColor: '#0288D1' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  deleteBtn: { marginTop: 40, backgroundColor: '#FFEBEE', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' },
  deleteText: { color: '#D32F2F', fontWeight: 'bold', fontSize: 16 },

  // SHARE CONTAINER STYLES
  shareContainer: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 20, borderWidth: 1, borderColor: '#B3E5FC' },
  sectionBlock: { marginBottom: 10 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#0288D1', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
  
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  smBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  smBtnText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  linkTextDisplay: { backgroundColor: '#f0f0f0', padding: 8, borderRadius: 5, fontSize: 12, color: '#333', marginBottom: 8 },
  copyBtn: { backgroundColor: '#0288D1', padding: 8, borderRadius: 5, alignItems: 'center' },
  copyBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  smallInput: { flex: 1, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 5, padding: 8, marginRight: 10 },
  addBtn: { backgroundColor: '#0288D1', padding: 10, borderRadius: 5 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

  userRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  userText: { color: '#333' },
  removeText: { color: 'red', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#999', fontStyle: 'italic', fontSize: 12 }
});