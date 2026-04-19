import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSiftStore } from '../../store';
import { colors } from '../../lib/theme';

const ONBOARDING_KEY = 'sift_onboarding_done';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setOnboardingDone } = useSiftStore();

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboardingDone(true);
    router.replace('/(tabs)');
  };

  const handleGetStarted = () => {
    router.push('/(onboarding)/preferences-setup');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Background glow */}
      <LinearGradient
        colors={['#6C47FF20', '#6C47FF08', '#0A0A0A00']}
        locations={[0, 0.5, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '60%' }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['#0A0A0A00', '#00D1FF08', '#0A0A0A00']}
        style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '40%' }}
        pointerEvents="none"
      />

      {/* Skip */}
      <Pressable
        onPress={handleSkip}
        style={{ position: 'absolute', top: insets.top + 16, right: 20 }}
        hitSlop={16}
      >
        <Text style={{ color: colors.subtle, fontSize: 14, fontWeight: '500' }}>Skip</Text>
      </Pressable>

      {/* Content */}
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          paddingHorizontal: 28,
          paddingBottom: insets.bottom + 36,
        }}
      >
        {/* Dot accent */}
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: colors.primary,
            marginBottom: 20,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 14,
            elevation: 10,
          }}
        />

        <Text
          style={{
            color: colors.text,
            fontSize: 42,
            fontWeight: '900',
            lineHeight: 48,
            letterSpacing: -1.5,
            marginBottom: 14,
          }}
        >
          Your personal{'\n'}decision engine.
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: 15,
            lineHeight: 24,
            marginBottom: 36,
            maxWidth: 300,
          }}
        >
          Point your camera at anything: food, products, restaurants. Get a score, a verdict, and smarter alternatives.
        </Text>

        {/* CTAs */}
        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#5A38E8' : colors.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginBottom: 12,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: pressed ? 0.2 : 0.35,
            shadowRadius: 16,
            elevation: 8,
          })}
        >
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, letterSpacing: 0.2 }}>
            Personalize Sift
          </Text>
        </Pressable>

        <Pressable onPress={handleSkip} style={{ alignItems: 'center', paddingVertical: 12 }}>
          <Text style={{ color: colors.subtle, fontSize: 14 }}>Use default settings</Text>
        </Pressable>
      </View>
    </View>
  );
}
