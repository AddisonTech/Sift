import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { supabase } from '../../lib/supabase';
import { useSiftStore } from '../../store';
import { verdictColor } from '../../lib/utils';
import ScoreRing from '../../components/results/ScoreRing';
import VerdictBadge from '../../components/results/VerdictBadge';
import ReasoningCard from '../../components/results/ReasoningCard';
import LocalAlternativeCard from '../../components/results/LocalAlternativeCard';
import OnlineAlternativeCard from '../../components/results/OnlineAlternativeCard';
import type { ScanResult } from '../../lib/types';

function AnimatedScore({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * score);
      setDisplayed(current);
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <Text
      style={{
        fontSize: 48,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: -2,
      }}
    >
      {displayed}
    </Text>
  );
}

export default function ResultsScreen() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentScan, scans } = useSiftStore();

  const [scan, setScan] = useState<ScanResult | null>(null);
  const [breakdown, setBreakdown] = useState<{
    price: number; quality: number; ethics: number; health: number; speed: number;
  } | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const contentOpacity = useSharedValue(0);
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  useEffect(() => {
    async function loadScan() {
      let found: ScanResult | null =
        currentScan?.id === scanId
          ? currentScan
          : scans.find((s) => s.id === scanId) ?? null;

      if (!found) {
        const { data } = await supabase
          .from('scans')
          .select('*')
          .eq('id', scanId)
          .single();

        if (data) {
          found = {
            id: data.id,
            user_id: data.user_id,
            image_url: data.image_url,
            item_name: data.item_name,
            item_category: data.item_category,
            score: data.score,
            verdict: data.verdict,
            reasoning: data.reasoning,
            local_alternatives: data.local_alternatives ?? [],
            online_alternatives: data.online_alternatives ?? [],
            location_lat: data.location_lat,
            location_lng: data.location_lng,
            created_at: data.created_at,
          };

          if (data.raw_response?.score_breakdown) {
            setBreakdown(data.raw_response.score_breakdown);
          }
        }
      }

      setScan(found);
      setLoading(false);
      contentOpacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
    }

    loadScan();
  }, [scanId]);

  const handleShare = async () => {
    if (!scan) return;
    await Share.share({
      message: `I scanned "${scan.item_name}" with Sift — score: ${scan.score}/100, verdict: ${scan.verdict}. "${scan.reasoning}"`,
    });
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6C47FF" />
      </View>
    );
  }

  if (!scan) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-text text-lg font-bold mb-2">Scan not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-primary text-sm">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const color = verdictColor(scan.verdict);

  return (
    <View className="flex-1 bg-background">
      <Animated.ScrollView
        style={[{ flex: 1 }, contentStyle]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View
          className="items-center px-6"
          style={{ paddingTop: insets.top + 24, paddingBottom: 32 }}
        >
          <View className="relative items-center justify-center" style={{ width: 180, height: 180 }}>
            <ScoreRing score={scan.score} size={180} />
            <View className="absolute items-center">
              <AnimatedScore score={scan.score} />
              <Text className="text-muted text-xs font-medium">/ 100</Text>
            </View>
          </View>

          <View className="mt-5 items-center">
            <VerdictBadge verdict={scan.verdict} />
            <Text
              className="text-text font-bold text-center mt-3"
              style={{ fontSize: 22, letterSpacing: -0.5, lineHeight: 28 }}
              numberOfLines={2}
            >
              {scan.item_name}
            </Text>
          </View>
        </View>

        <ReasoningCard scan={scan} breakdown={breakdown} />

        {scan.local_alternatives.length > 0 && (
          <View className="mb-4">
            <Text className="text-muted text-xs font-semibold uppercase tracking-wider px-4 mb-3">
              Nearby
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {scan.local_alternatives.map((alt) => (
                <LocalAlternativeCard key={alt.id} alternative={alt} />
              ))}
            </ScrollView>
          </View>
        )}

        {scan.online_alternatives.length > 0 && (
          <View className="mb-4">
            <Text className="text-muted text-xs font-semibold uppercase tracking-wider px-4 mb-3">
              Online
            </Text>
            {scan.online_alternatives.map((alt) => (
              <OnlineAlternativeCard key={alt.id} alternative={alt} />
            ))}
          </View>
        )}
      </Animated.ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 flex-row px-4 gap-3 bg-background/95"
        style={{ paddingBottom: insets.bottom + 12, paddingTop: 12, borderTopColor: '#2A2A2A', borderTopWidth: 1 }}
      >
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          className="flex-1 bg-surface border border-border rounded-xl py-3.5 items-center"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-text font-semibold text-sm">Scan Again</Text>
        </Pressable>
        <Pressable
          onPress={handleShare}
          className="flex-1 rounded-xl py-3.5 items-center"
          style={({ pressed }) => ({
            backgroundColor: `${color}22`,
            borderColor: `${color}55`,
            borderWidth: 1,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ color, fontWeight: '600', fontSize: 14 }}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}
