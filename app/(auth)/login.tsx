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
import { colors } from '../../lib/theme';

const ONBOARDING_KEY = 'sift_onboarding_done';

const BASE_INPUT: object = {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: 10,
  paddingHorizontal: 16,
  paddingVertical: 15,
  color: colors.text,
  fontSize: 15,
  letterSpacing: 0.1,
};

const FOCUSED_INPUT: object = {
  borderColor: colors.primary,
  backgroundColor: colors.background,
};

const LABEL: object = {
  color: colors.subtle,
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
      style={{ flex: 1, backgroundColor: colors.background }}
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
                backgroundColor: colors.primary,
                marginBottom: 18,
                shadowColor: colors.primary,
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
                color: colors.text,
                letterSpacing: -4,
                lineHeight: 68,
                textAlign: 'center',
              }}
            >
              Sift
            </Text>
            <Text
              style={{
                color: colors.subtle,
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
              <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center' }}>
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
              placeholderTextColor={colors.placeholder}
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
              placeholderTextColor={colors.placeholder}
              placeholder="••••••••"
              style={[BASE_INPUT, focused === 'password' && FOCUSED_INPUT]}
            />
          </View>

          {/* ── Sign In ── */}
          <Pressable
            onPress={handleSignIn}
            disabled={anyLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#5A38E8' : colors.primary,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              height: 52,
              opacity: anyLoading ? 0.6 : 1,
            })}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, letterSpacing: 0.2 }}>
                Sign In
              </Text>
            )}
          </Pressable>

          {/* ── Divider ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            <Text style={{ color: colors.placeholder, fontSize: 12, marginHorizontal: 14 }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          </View>

          {/* ── Continue as Guest ── */}
          <Pressable
            onPress={handleGuest}
            disabled={anyLoading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.surface : 'transparent',
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
              justifyContent: 'center',
              height: 52,
              opacity: anyLoading ? 0.6 : 1,
            })}
          >
            {guestLoading ? (
              <ActivityIndicator color={colors.subtle} size="small" />
            ) : (
              <Text style={{ color: colors.muted, fontWeight: '600', fontSize: 14, letterSpacing: 0.2 }}>
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
            <Text style={{ color: colors.subtle, fontSize: 13 }}>New to Sift?{'  '}</Text>
            <Pressable onPress={() => router.push('/(auth)/signup')} disabled={anyLoading}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                Create account
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
