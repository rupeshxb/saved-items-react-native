import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, StatusBar, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

export default function LoginScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Success! The auth listener in index.tsx will handle the redirect.
      // But we can also force it for good measure:
      router.replace('/'); 
    } catch (error: any) {
      let msg = error.message;
      if (msg.includes('invalid-credential')) msg = "Wrong email or password.";
      if (msg.includes('invalid-email')) msg = "Please enter a valid email.";
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0288D1" />
      
      {/* HEADER */}
      <View style={styles.skyHeader}>
        <View style={styles.vaultIconContainer}>
            <Text style={{fontSize: 32}}>🛡️</Text>
        </View>
        <Text style={styles.headerTitle}>SecureVault</Text>
        <Text style={styles.headerSubtitle}>Access Your Secrets</Text>
      </View>

      {/* FORM SECTION */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.formContainer}
      >
        <View style={styles.card}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput 
                style={styles.input} 
                placeholder="you@example.com" 
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput 
                style={styles.input} 
                placeholder="••••••••" 
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {loading ? (
                <ActivityIndicator size="large" color="#0288D1" style={{marginTop: 20}} />
            ) : (
                <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
                    <Text style={styles.loginBtnText}>Unlock Vault</Text>
                </TouchableOpacity>
            )}

            <View style={styles.divider} />

            <View style={styles.footer}>
                <Text style={styles.footerText}>New here? </Text>
                <TouchableOpacity onPress={() => router.push('/register')}>
                    <Text style={styles.linkText}>Create Access ID</Text>
                </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F9FF' },
  
  // HEADER
  skyHeader: { 
    backgroundColor: '#0288D1', 
    height: 250, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingTop: 20,
    borderBottomRightRadius: 30,
    borderBottomLeftRadius: 30,
    elevation: 5,
    shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 5
  },
  vaultIconContainer: { 
    width: 80, height: 80, borderRadius: 25, 
    backgroundColor: 'rgba(255,255,255,0.2)', 
    justifyContent: 'center', alignItems: 'center', 
    marginBottom: 15 
  },
  headerTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  headerSubtitle: { color: '#B3E5FC', fontSize: 16, marginTop: 5 },

  // FORM
  formContainer: { flex: 1, paddingHorizontal: 20, marginTop: -40 },
  card: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 15, 
    elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10
  },
  label: { fontSize: 14, color: '#546E7A', marginBottom: 8, fontWeight: '600', textTransform: 'uppercase' },
  input: { 
    borderWidth: 1, borderColor: '#CFD8DC', borderRadius: 8, 
    padding: 15, marginBottom: 20, fontSize: 16, backgroundColor: '#FAFAFA' 
  },
  loginBtn: { 
    backgroundColor: '#0288D1', padding: 16, borderRadius: 8, 
    alignItems: 'center', marginTop: 10, shadowOpacity: 0.2, elevation: 3 
  },
  loginBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#ECEFF1', marginVertical: 25 },

  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerText: { color: '#78909C', fontSize: 15 },
  linkText: { color: '#0288D1', fontSize: 15, fontWeight: 'bold' }
});