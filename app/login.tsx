import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, 
  KeyboardAvoidingView, Platform, StyleSheet 
} from 'react-native';
import { useRouter } from 'expo-router';
// 👇 IMPORT THE FUNCTION DIRECTLY
import { signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { FIREBASE_AUTH } from '../src/core/services/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Info', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      // 👇 NEW MODULAR SYNTAX: Pass the AUTH object as the first argument
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);
      
      router.replace('/'); 
    } catch (error: any) {
      let message = "An error occurred.";
      if (error.code === 'auth/invalid-email') message = "That email address is invalid.";
      if (error.code === 'auth/user-not-found') message = "No user found with this email.";
      if (error.code === 'auth/wrong-password') message = "Incorrect password.";
      if (error.code === 'auth/invalid-credential') message = "Invalid email or password.";
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // ... (The rest of your Return/JSX code stays exactly the same) ...
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} placeholder="hello@example.com" placeholderTextColor="#999" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#999" value={password} onChangeText={setPassword} secureTextEntry />
        </View>
        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Log In</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/register')} style={styles.linkContainer}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Sign Up</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F3F4F6' },
  card: { backgroundColor: 'white', padding: 24, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', padding: 12, borderRadius: 8, fontSize: 16, backgroundColor: '#F9FAFB', color: '#1F2937' },
  button: { backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  buttonDisabled: { backgroundColor: '#93C5FD' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  linkContainer: { marginTop: 24, alignItems: 'center' },
  linkText: { color: '#6B7280', fontSize: 14 },
  linkHighlight: { color: '#2563EB', fontWeight: 'bold' }
});