import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useSiftStore } from '../../store';
import { usePreferences } from '../../hooks/usePreferences';
import SiftCamera, { type SiftCameraRef } from '../../components/camera/SiftCamera';
import type { ScanResult, ItemCategory, VerdictType } from '../../lib/types';

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<SiftCameraRef>(null);
  const { preferences } = usePreferences();
  const { setCurrentScan, addScan, isAnalyzing, setIsAnalyzing } = useSiftStore();

  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const flashOpacity = useSharedValue(0);
  const bracketScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  React.useEffect(() => {
    bracketScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
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
          .then(({ data: profile }) => {
            setUserAvatarUrl(profile?.avatar_url ?? null);
          });
      }
    });
  }, []);

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const bracketStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bracketScale.value }],
  }));

  const handleCapture = useCallback(async () => {
    if (isAnalyzing || !cameraRef.current) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    flashOpacity.value = withSequence(
      withTiming(0.6, { duration: 60 }),
      withTiming(0, { duration: 240 }),
    );

    setIsAnalyzing(true);
    setScanError(null);

    try {
      const base64 = await cameraRef.current.capturePhoto();

      let location: { lat: number; lng: number } | null = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }

      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        'analyze-item',
        {
          body: {
            imageBase64: base64,
            mimeType: 'image/jpeg',
            location,
            preferences,
          },
        },
      );

      if (analysisError || !analysisData) {
        throw new Error(analysisError?.message ?? 'Analysis failed');
      }

      const { data: altData } = await supabase.functions.invoke('find-alternatives', {
        body: {
          location,
          item_name: analysisData.item_name,
          item_category: analysisData.item_category,
          search_query: analysisData.search_query,
        },
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const scanPayload = {
        user_id: user.id,
        image_url: null,
        item_name: analysisData.item_name as string,
        item_category: (analysisData.item_category ?? 'other') as ItemCategory,
        score: analysisData.base_score as number,
        verdict: analysisData.verdict as VerdictType,
        reasoning: analysisData.reasoning as string,
        local_alternatives: altData?.local_alternatives ?? [],
        online_alternatives: altData?.online_alternatives ?? [],
        location_lat: location?.lat ?? null,
        location_lng: location?.lng ?? null,
        raw_response: analysisData,
      };

      const { data: savedScan, error: saveError } = await supabase
        .from('scans')
        .insert(scanPayload)
        .select()
        .single();

      if (saveError || !savedScan) throw new Error(saveError?.message ?? 'Save failed');

      const scanResult: ScanResult = {
        id: savedScan.id,
        user_id: savedScan.user_id,
        image_url: savedScan.image_url,
        item_name: savedScan.item_name,
        item_category: savedScan.item_category,
        score: savedScan.score,
        verdict: savedScan.verdict,
        reasoning: savedScan.reasoning,
        local_alternatives: savedScan.local_alternatives ?? [],
        online_alternatives: savedScan.online_alternatives ?? [],
        location_lat: savedScan.location_lat,
        location_lng: savedScan.location_lng,
        created_at: savedScan.created_at,
      };

      setCurrentScan(scanResult);
      addScan(scanResult);
      router.push(`/results/${savedScan.id}`);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed. Try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, preferences]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Camera */}
      <SiftCamera ref={cameraRef} />

      {/* Flash overlay */}
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', inset: 0, backgroundColor: '#FFFFFF' }, flashStyle]}
      />

      {/* Top gradient for header readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.32)', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 180 }}
        pointerEvents="none"
      />

      {/* Bottom gradient for controls readability */}
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
            style={{
              width: 34, height: 34, borderRadius: 17,
              borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)',
            }}
          />
        ) : (
          <View
            style={{
              width: 34, height: 34, borderRadius: 17,
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
            }}
          />
        )}
      </View>

      {/* Center: bracket overlay + status */}
      <View
        style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}
        pointerEvents="none"
      >
        <Animated.View style={bracketStyle}>
          <View style={{ width: 240, height: 240 }}>
            {/* Corner brackets with glow */}
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
                  borderColor: '#6C47FF',
                  shadowColor: '#6C47FF',
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
          <Text
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12,
              marginTop: 20,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            Point at anything
          </Text>
        )}
      </View>

      {/* Error banner */}
      {scanError && (
        <View
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 148,
            backgroundColor: 'rgba(255,61,113,0.12)',
            borderWidth: 1,
            borderColor: 'rgba(255,61,113,0.25)',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: '#FF3D71', fontSize: 13, textAlign: 'center' }}>{scanError}</Text>
        </View>
      )}

      {/* Bottom controls */}
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
            <ActivityIndicator size="large" color="#6C47FF" />
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 0.5 }}>
              Analyzing…
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={handleCapture}
            style={({ pressed }) => ({
              width: 80,
              height: 80,
              borderRadius: 40,
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
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: '#FFFFFF',
                shadowColor: '#FFFFFF',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
