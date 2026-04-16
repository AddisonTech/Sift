import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 justify-center pb-12" style={{ paddingTop: insets.top }}>
          <View className="items-center mb-12">
            <Text
              style={{ fontSize: 52, fontWeight: '800', color: '#6C47FF', letterSpacing: -2 }}
            >
              Sift
            </Text>
            <Text className="text-muted text-base mt-2">Point. Score. Decide.</Text>
          </View>

          {error && (
            <View className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-5">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-muted text-xs font-semibold mb-2 uppercase tracking-wider">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholderTextColor="#9E9E9E"
              placeholder="you@example.com"
              style={{
                backgroundColor: '#141414',
                borderWidth: 1,
                borderColor: '#2A2A2A',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: '#FFFFFF',
                fontSize: 15,
              }}
            />
          </View>

          <View className="mb-6">
            <Text className="text-muted text-xs font-semibold mb-2 uppercase tracking-wider">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholderTextColor="#9E9E9E"
              placeholder="••••••••"
              style={{
                backgroundColor: '#141414',
                borderWidth: 1,
                borderColor: '#2A2A2A',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: '#FFFFFF',
                fontSize: 15,
              }}
            />
          </View>

          <Pressable
            onPress={handleSignIn}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center mb-5"
            style={({ pressed }) => ({ opacity: pressed || loading ? 0.7 : 1 })}
          >
            <Text className="text-text font-bold text-base">
              {loading ? 'Signing in…' : 'Sign In'}
            </Text>
          </Pressable>

          <View className="flex-row justify-center">
            <Text className="text-muted text-sm">Don&apos;t have an account? </Text>
            <Link href="/(auth)/signup">
              <Text className="text-primary text-sm font-semibold">Sign Up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
