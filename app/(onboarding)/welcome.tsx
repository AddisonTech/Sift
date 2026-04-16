import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'sift_onboarding_done';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleSkip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/(tabs)');
  };

  const handleGetStarted = () => {
    router.push('/(onboarding)/preferences-setup');
  };

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={['#6C47FF18', '#00D1FF08', '#0A0A0A']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <Pressable
        onPress={handleSkip}
        className="absolute top-14 right-6 z-10"
        hitSlop={12}
      >
        <Text className="text-muted text-sm font-medium">Skip</Text>
      </Pressable>

      <View className="flex-1 justify-end px-6 pb-16">
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 42,
            fontWeight: '800',
            lineHeight: 50,
            letterSpacing: -1.5,
            marginBottom: 16,
          }}
        >
          Your personal{'\n'}decision engine.
        </Text>
        <Text className="text-muted text-base leading-relaxed mb-12" style={{ maxWidth: 300 }}>
          Point your camera at anything. Get a score, a verdict, and smarter alternatives.
        </Text>

        <Pressable
          onPress={handleGetStarted}
          className="bg-primary rounded-xl py-4 items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <Text className="text-text font-bold text-base">Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
}
