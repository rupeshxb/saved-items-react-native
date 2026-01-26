import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
// 👇 IMPORT FUNCTION DIRECTLY
import { createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import { FIREBASE_AUTH } from '../src/core/services/firebase';

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      // 👇 NEW MODULAR SYNTAX
      await createUserWithEmailAndPassword(FIREBASE_AUTH, email, password);
      Alert.alert('Success', 'Account created! Logging you in...');
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ... (Return/JSX stays same) ...
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign Up</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f0f2f5' },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 10, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 6, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#10B981', padding: 15, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#2563EB', fontWeight: '600' }
});