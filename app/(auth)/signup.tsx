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
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';

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

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Fill in all fields to continue.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    }
    // Email confirmation is disabled; auth state fires immediately,
    // _layout.tsx picks up the new session and routes to onboarding.
  };

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
            paddingTop: insets.top + 48,
            paddingBottom: insets.bottom + 32,
          }}
        >
          {/* ── Back ── */}
          <Pressable
            onPress={() => router.back()}
            style={{ marginBottom: 36, alignSelf: 'flex-start' }}
            hitSlop={12}
          >
            <Text style={{ color: colors.subtle, fontSize: 13, fontWeight: '500' }}>← Back</Text>
          </Pressable>

          <View style={{ marginBottom: 40 }}>
            <Text
              style={{
                fontSize: 34,
                fontWeight: '800',
                color: colors.text,
                letterSpacing: -1.5,
                lineHeight: 38,
                marginBottom: 6,
              }}
            >
              Create account
            </Text>
            <Text style={{ color: colors.subtle, fontSize: 14, letterSpacing: 0.1 }}>
              Start making better decisions today.
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

          {/* ── Name ── */}
          <View style={{ marginBottom: 14 }}>
            <Text style={LABEL}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              autoCapitalize="words"
              autoComplete="name"
              placeholderTextColor={colors.placeholder}
              placeholder="Your name"
              style={[BASE_INPUT, focused === 'name' && FOCUSED_INPUT]}
            />
          </View>

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
          <View style={{ marginBottom: 28 }}>
            <Text style={LABEL}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              secureTextEntry
              autoComplete="new-password"
              placeholderTextColor={colors.placeholder}
              placeholder="Minimum 6 characters"
              style={[BASE_INPUT, focused === 'password' && FOCUSED_INPUT]}
            />
          </View>

          {/* ── Create Account ── */}
          <Pressable
            onPress={handleSignUp}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#5A38E8' : colors.primary,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              height: 52,
              opacity: loading ? 0.6 : 1,
              marginBottom: 28,
            })}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} size="small" />
            ) : (
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, letterSpacing: 0.2 }}>
                Create Account
              </Text>
            )}
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.subtle, fontSize: 13 }}>Already have an account?{'  '}</Text>
            <Pressable onPress={() => router.replace('/(auth)/login')} disabled={loading}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
