import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
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

  React.useEffect(() => {
    bracketScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sine) }),
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
      withTiming(0.7, { duration: 80 }),
      withTiming(0, { duration: 200 }),
    );

    setIsAnalyzing(true);

    setScanError(null);

    try {
      const base64 = await cameraRef.current.capturePhoto();

      let location: { lat: number; lng: number } | null = null;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
    <View className="flex-1 bg-background">
      <SiftCamera ref={cameraRef} />

      <Animated.View
        pointerEvents="none"
        className="absolute inset-0 bg-white"
        style={flashStyle}
      />

      <View
        className="absolute top-0 left-0 right-0 flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 12 }}
        pointerEvents="box-none"
      >
        <Text
          style={{ fontSize: 22, fontWeight: '800', color: '#6C47FF', letterSpacing: -0.5 }}
        >
          Sift
        </Text>
        {userAvatarUrl ? (
          <Image
            source={{ uri: userAvatarUrl }}
            style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: '#2A2A2A' }}
          />
        ) : (
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#1C1C1C',
              borderWidth: 1.5,
              borderColor: '#2A2A2A',
            }}
          />
        )}
      </View>

      <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
        <Animated.View style={[bracketStyle]}>
          <View style={{ width: 220, height: 220 }}>
            <View
              style={{
                position: 'absolute', top: 0, left: 0,
                width: 36, height: 36,
                borderTopWidth: 2, borderLeftWidth: 2,
                borderColor: '#6C47FF',
                borderTopLeftRadius: 6,
              }}
            />
            <View
              style={{
                position: 'absolute', top: 0, right: 0,
                width: 36, height: 36,
                borderTopWidth: 2, borderRightWidth: 2,
                borderColor: '#6C47FF',
                borderTopRightRadius: 6,
              }}
            />
            <View
              style={{
                position: 'absolute', bottom: 0, left: 0,
                width: 36, height: 36,
                borderBottomWidth: 2, borderLeftWidth: 2,
                borderColor: '#6C47FF',
                borderBottomLeftRadius: 6,
              }}
            />
            <View
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 36, height: 36,
                borderBottomWidth: 2, borderRightWidth: 2,
                borderColor: '#6C47FF',
                borderBottomRightRadius: 6,
              }}
            />
          </View>
        </Animated.View>

        {!isAnalyzing && (
          <Text className="text-white/50 text-sm mt-6" style={{ letterSpacing: 0.3 }}>
            Point at anything
          </Text>
        )}
      </View>

      {scanError && (
        <View
          className="absolute left-4 right-4 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3"
          style={{ bottom: 140 }}
        >
          <Text className="text-danger text-sm text-center">{scanError}</Text>
        </View>
      )}

      <View
        className="absolute bottom-0 left-0 right-0 items-center"
        style={{ paddingBottom: 40 }}
      >
        {isAnalyzing ? (
          <View className="items-center">
            <ActivityIndicator size="large" color="#6C47FF" />
            <Text className="text-muted text-sm mt-3">Analyzing…</Text>
          </View>
        ) : (
          <Pressable
            onPress={handleCapture}
            style={({ pressed }) => ({
              width: 76,
              height: 76,
              borderRadius: 38,
              borderWidth: 3,
              borderColor: '#FFFFFF',
              backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FFFFFF',
              }}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
