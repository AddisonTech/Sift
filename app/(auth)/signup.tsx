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

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      router.replace('/(onboarding)/welcome');
    }
  };

  const inputStyle = {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
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
            <Text className="text-muted text-base mt-2">Create your account</Text>
          </View>

          {error && (
            <View className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-5">
              <Text className="text-danger text-sm">{error}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="text-muted text-xs font-semibold mb-2 uppercase tracking-wider">
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="#9E9E9E"
              placeholder="Your name"
              style={inputStyle}
            />
          </View>

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
              style={inputStyle}
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
              autoComplete="new-password"
              placeholderTextColor="#9E9E9E"
              placeholder="••••••••"
              style={inputStyle}
            />
          </View>

          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center mb-5"
            style={({ pressed }) => ({ opacity: pressed || loading ? 0.7 : 1 })}
          >
            <Text className="text-text font-bold text-base">
              {loading ? 'Creating account…' : 'Create Account'}
            </Text>
          </Pressable>

          <View className="flex-row justify-center">
            <Text className="text-muted text-sm">Already have an account? </Text>
            <Link href="/(auth)/login">
              <Text className="text-primary text-sm font-semibold">Sign In</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
