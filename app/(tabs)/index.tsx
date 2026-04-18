import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { supabase } from '../../lib/supabase';
import { useSiftStore } from '../../store';
import { useAnalyzePipeline } from '../../hooks/useAnalyzePipeline';
import { colors } from '../../lib/theme';
import SiftCamera, { type SiftCameraRef } from '../../components/camera/SiftCamera';

// ── Web: text-describe interface ─────────────────────────────────────────────

function WebScanScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);

  const { analyze, isAnalyzing } = useAnalyzePipeline();

  const flashOpacity = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => setUserAvatarUrl(profile?.avatar_url ?? null));
      }
    });
  }, []);

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || isAnalyzing) return;
    setError(null);
    flashOpacity.value = withSequence(
      withTiming(0.25, { duration: 60 }),
      withTiming(0, { duration: 240 }),
    );
    inputRef.current?.blur();
    await analyze({ textQuery: trimmed }, setError);
  };

  const canSubmit = query.trim().length > 0 && !isAnalyzing;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000000' }}
      behavior="padding"
    >
      {/* Flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF' }, flashStyle]}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.32)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 260 }}
        pointerEvents="none"
      />

      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: insets.top + 14,
        }}
        pointerEvents="box-none"
      >
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>
          Sift
        </Text>
        {userAvatarUrl ? (
          <Image
            source={{ uri: userAvatarUrl }}
            style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' }}
          />
        ) : (
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' }} />
        )}
      </View>

      {/* Center content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Circle cx={11} cy={11} r={7} stroke={colors.primary} strokeWidth={2} />
            <Path d="M17 17l3.5 3.5" stroke={colors.primary} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>

        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 20, letterSpacing: -0.4, marginBottom: 6, textAlign: 'center' }}>
          Describe what to evaluate
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
          Type the product, place, or food you want scored
        </Text>

        {/* Input */}
        <View
          style={{
            width: '100%',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: focused ? `${colors.primary}60` : 'rgba(255,255,255,0.12)',
            paddingHorizontal: 16,
            paddingVertical: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle cx={11} cy={11} r={7} stroke={focused ? colors.primary : 'rgba(255,255,255,0.35)'} strokeWidth={2} />
            <Path d="M17 17l3.5 3.5" stroke={focused ? colors.primary : 'rgba(255,255,255,0.35)'} strokeWidth={2} strokeLinecap="round" />
          </Svg>
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder='e.g. "Starbucks caramel macchiato"'
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={{ flex: 1, color: '#FFFFFF', fontSize: 14 }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isAnalyzing}
          />
          {query.length > 0 && !isAnalyzing && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 16 }}>×</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Error banner */}
      {error && (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom + 116,
            backgroundColor: `${colors.danger}1F`,
            borderWidth: 1,
            borderColor: `${colors.danger}40`,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center' }}>{error}</Text>
        </View>
      )}

      {/* Bottom button — matches camera shutter position */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          paddingBottom: insets.bottom + 28,
        }}
      >
        {isAnalyzing ? (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 0.5 }}>
              Analyzing…
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => ({
              width: 80,
              height: 80,
              borderRadius: 40,
              borderWidth: 3,
              borderColor: canSubmit ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.25)',
              backgroundColor: pressed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: pressed ? 0.95 : 1 }],
            })}
          >
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: canSubmit ? '#FFFFFF' : 'rgba(255,255,255,0.25)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Circle cx={11} cy={11} r={7} stroke={canSubmit ? colors.primary : 'rgba(255,255,255,0.4)'} strokeWidth={2.5} />
                <Path d="M17 17l3.5 3.5" stroke={canSubmit ? colors.primary : 'rgba(255,255,255,0.4)'} strokeWidth={2.5} strokeLinecap="round" />
              </Svg>
            </View>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Mobile: camera interface ──────────────────────────────────────────────────

function MobileScanScreen() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<SiftCameraRef>(null);
  const { isAnalyzing, setIsAnalyzing } = useSiftStore();
  const { analyze } = useAnalyzePipeline();

  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const flashOpacity = useSharedValue(0);
  const bracketScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    bracketScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 1200, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.22, { duration: 1200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 1200, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', data.user.id)
          .single()
          .then(({ data: profile }) => setUserAvatarUrl(profile?.avatar_url ?? null));
      }
    });
  }, []);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));
  const bracketStyle = useAnimatedStyle(() => ({ transform: [{ scale: bracketScale.value }] }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const handleCapture = useCallback(async () => {
    if (isAnalyzing || !cameraRef.current) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    flashOpacity.value = withSequence(
      withTiming(0.6, { duration: 60 }),
      withTiming(0, { duration: 240 }),
    );
    setScanError(null);
    const base64 = await cameraRef.current.capturePhoto();
    await analyze({ imageBase64: base64, mimeType: 'image/jpeg' }, setScanError);
  }, [isAnalyzing, analyze]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <SiftCamera ref={cameraRef} />

      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FFFFFF' }, flashStyle]}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.32)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 220 }}
        pointerEvents="none"
      />

      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: insets.top + 14,
        }}
        pointerEvents="box-none"
      >
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 }}>
          Sift
        </Text>
        {userAvatarUrl ? (
          <Image
            source={{ uri: userAvatarUrl }}
            style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' }}
          />
        ) : (
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)' }} />
        )}
      </View>

      {/* Bracket overlay */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}
        pointerEvents="none"
      >
        <Animated.View style={bracketStyle}>
          <View style={{ width: 240, height: 240 }}>
            {[
              { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 8 },
              { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 8 },
              { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 8 },
              { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 8 },
            ].map((s, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  width: 40, height: 40,
                  borderColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 6,
                  elevation: 6,
                  ...s,
                }}
              />
            ))}
          </View>
        </Animated.View>
        {!isAnalyzing && (
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 20, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Point at anything
          </Text>
        )}
      </View>

      {/* Error banner */}
      {scanError && (
        <View
          style={{
            position: 'absolute',
            left: 16, right: 16, bottom: 148,
            backgroundColor: `${colors.danger}1F`,
            borderWidth: 1,
            borderColor: `${colors.danger}40`,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center' }}>{scanError}</Text>
        </View>
      )}

      {/* Shutter */}
      <View
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          alignItems: 'center',
          paddingBottom: insets.bottom + 28,
        }}
      >
        {isAnalyzing ? (
          <View style={{ alignItems: 'center', gap: 12 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 0.5 }}>Analyzing…</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View
              pointerEvents="none"
              style={[{
                position: 'absolute',
                width: 80, height: 80, borderRadius: 40,
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.6)',
              }, pulseStyle]}
            />
            <Pressable
              onPress={handleCapture}
              style={({ pressed }) => ({
                width: 80, height: 80, borderRadius: 40,
                borderWidth: 3,
                borderColor: 'rgba(255,255,255,0.85)',
                backgroundColor: pressed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: pressed ? 0.3 : 0.12,
                shadowRadius: 16,
                elevation: 8,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              })}
            >
              <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFFFFF' }} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Entry ─────────────────────────────────────────────────────────────────────

export default function ScanScreen() {
  return Platform.OS === 'web' ? <WebScanScreen /> : <MobileScanScreen />;
}
