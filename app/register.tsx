import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthRepository } from '../services/AuthRepository';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      await AuthRepository.register(email, password, username);
      router.replace('/');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>Create Account</Text>
        <Text style={styles.tagline}>Setup your secure vault today.</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Username</Text>
        <TextInput 
            placeholder="JohnDoe" 
            placeholderTextColor="#B0BEC5"
            value={username} 
            onChangeText={setUsername} 
            style={styles.input} 
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput 
            placeholder="you@example.com" 
            placeholderTextColor="#B0BEC5"
            value={email} 
            onChangeText={setEmail} 
            style={styles.input} 
            autoCapitalize="none"
            keyboardType="email-address"
        />

        <Text style={styles.label}>Master Password</Text>
        <TextInput 
            placeholder="••••••••" 
            placeholderTextColor="#B0BEC5"
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
            style={styles.input} 
        />

        <TouchableOpacity 
            style={styles.registerBtn} 
            onPress={handleRegister} 
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.registerText}>Generate Vault</Text>
            )}
        </TouchableOpacity>

        <View style={styles.footer}>
            <Text style={styles.footerText}>Already have a vault?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={styles.linkText}> Login here</Text>
            </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', paddingHorizontal: 30 },
  
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#0288D1' },
  tagline: { fontSize: 16, color: '#78909C', marginTop: 5 },

  formContainer: { width: '100%' },
  label: { color: '#455A64', fontWeight: '600', marginBottom: 8, marginLeft: 5 },
  input: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#ECEFF1',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    marginBottom: 20
  },
  registerBtn: {
    backgroundColor: '#0288D1',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: "#0288D1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 10
  },
  registerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
  footerText: { color: '#78909C' },
  linkText: { color: '#0288D1', fontWeight: 'bold' }
});