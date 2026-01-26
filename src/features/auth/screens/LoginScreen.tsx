import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FIREBASE_AUTH } from '../../../core/services/firebase';

export default function LoginScreen() {
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
      await FIREBASE_AUTH.signInWithEmailAndPassword(email, password);
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-gray-100">
      <View className="items-center mb-10">
        <Text className="text-3xl font-bold text-gray-800">Welcome Back</Text>
        <Text className="text-gray-500 mt-2">Sign in to access your saved items</Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-gray-600 mb-1 ml-1 font-medium">Email</Text>
          <TextInput
            className="w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
            placeholder="hello@example.com"
            placeholderTextColor="#9CA3AF"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View>
          <Text className="text-gray-600 mb-1 ml-1 font-medium">Password</Text>
          <TextInput
            className="w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-800"
            placeholder="••••••••"
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-blue-600 p-4 rounded-xl items-center mt-6 shadow-sm active:bg-blue-700"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Log In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}