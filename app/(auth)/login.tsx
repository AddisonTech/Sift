import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

const ONBOARDING_KEY = 'sift_onboarding_done';

const BASE_INPUT: object = {
  backgroundColor: '#111111',
  borderWidth: 1,
  borderColor: '#252525',
  borderRadius: 10,
  paddingHorizontal: 16,
  paddingVertical: 15,
  color: '#FFFFFF',
  fontSize: 15,
  letterSpacing: 0.1,
};

const FOCUSED_INPUT: object = {
  borderColor: '#6C47FF',
  backgroundColor: '#0D0D0D',
};

const LABEL: object = {
  color: '#555555',
  fontSize: 11,
  fontWeight: '600' as const,
  letterSpacing: 1,
  textTransform: 'uppercase' as const,
  marginBottom: 8,
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (authError) setError(authError.message);
  };

  const handleGuest = async () => {
    setGuestLoading(true);
    setError(null);
    // Mark onboarding done before auth fires so _layout re-read sees it
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    const { error: authError } = await supabase.auth.signInAnonymously();
    if (authError) {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setError('Unable to continue as guest. Try again.');
      setGuestLoading(false);
    }
    // On success, auth state change fires → _layout.tsx re-reads onboarding → navigates
  };

  const anyLoading = loading || guestLoading;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A0A0A' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Ambient top glow */}
      <LinearGradient
        colors={['#6C47FF26', '#6C47FF08', '#0A0A0A00']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340 }}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: 28,
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 32,
          }}
        >
          {/* ── Wordmark ── */}
          <View style={{ alignItems: 'center', marginBottom: 52 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#6C47FF',
                marginBottom: 18,
                shadowColor: '#6C47FF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 1,
                shadowRadius: 12,
                elevation: 10,
              }}
            />
            <Text
              style={{
                fontSize: 68,
                fontWeight: '900',
                color: '#FFFFFF',
                letterSpacing: -4,
                lineHeight: 68,
                textAlign: 'center',
              }}
            >
              Sift
            </Text>
            <Text
              style={{
                color: '#404040',
                fontSize: 12,
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                marginTop: 10,
                textAlign: 'center',
              }}
            >
              Point · Score · Decide
            </Text>
          </View>

          {/* ── Error banner ── */}
          {error && (
            <View
              style={{
                backgroundColor: 'rgba(255,61,113,0.08)',
                borderWidth: 1,
                borderColor: 'rgba(255,61,113,0.18)',
                borderRadius: 10,
                paddingVertical: 11,
                paddingHorizontal: 14,
                marginBottom: 20,
              }}
            >
              <Text style={{ color: '#FF3D71', fontSize: 13, textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          )}

          {/* ── Email ── */}
          <View style={{ marginBottom: 14 }}>
            <Text style={LABEL}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholderTextColor="#303030"
              placeholder="you@example.com"
              style={[BASE_INPUT, focused === 'email' && FOCUSED_INPUT]}
            />
          </View>

          {/* ── Password ── */}
          <View style={{ marginBottom: 24 }}>
            <Text style={LABEL}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry
              autoComplete="password"
              placeholderTextColor="#303030"
              placeholder="••••••••"
              style={[BASE_INPUT, focused === 'password' && FOCUSED_INPUT]}
            />
          </View>

          {/* ── Sign In ── */}
          <Pressable
            onPress={handleSignIn}
            disabled={anyLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#5A38E8' : '#6C47FF',
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              height: 52,
              opacity: anyLoading ? 0.6 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 }}>
                Sign In
              </Text>
            )}
          </Pressable>

          {/* ── Divider ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#1A1A1A' }} />
            <Text style={{ color: '#303030', fontSize: 12, marginHorizontal: 14 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#1A1A1A' }} />
          </View>

          {/* ── Continue as Guest ── */}
          <Pressable
            onPress={handleGuest}
            disabled={anyLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#141414' : 'transparent',
              borderWidth: 1,
              borderColor: '#222222',
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              height: 52,
              opacity: anyLoading ? 0.6 : 1,
            })}
          >
            {guestLoading ? (
              <ActivityIndicator color="#555555" size="small" />
            ) : (
              <Text style={{ color: '#888888', fontWeight: '600', fontSize: 14, letterSpacing: 0.2 }}>
                Continue as Guest
              </Text>
            )}
          </Pressable>

          {/* ── Create account ── */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 28,
            }}
          >
            <Text style={{ color: '#3A3A3A', fontSize: 13 }}>New to Sift?{'  '}</Text>
            <Pressable onPress={() => router.push('/(auth)/signup')} disabled={anyLoading}>
              <Text style={{ color: '#6C47FF', fontSize: 13, fontWeight: '600' }}>
                Create account
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
