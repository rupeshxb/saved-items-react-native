import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>App is Working!</Text>
      <Text style={styles.subtext}>If you see this, the routing is fixed.</Text>
      <Link href="/login" style={styles.link}>
        Go to Login Screen
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtext: { fontSize: 16, color: '#666', marginBottom: 20 },
  link: { fontSize: 18, color: 'blue', textDecorationLine: 'underline' },
});