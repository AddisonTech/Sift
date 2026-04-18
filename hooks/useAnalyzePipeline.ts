import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useSiftStore } from '../store';
import { usePreferences } from './usePreferences';
import type { ScanResult, ItemCategory, VerdictType } from '../lib/types';

type AnalyzeInput =
  | { imageBase64: string; mimeType: string; textQuery?: never }
  | { textQuery: string; imageBase64?: never; mimeType?: never };

export function useAnalyzePipeline() {
  const router = useRouter();
  const { preferences } = usePreferences();
  const { setCurrentScan, addScan, isAnalyzing, setIsAnalyzing } = useSiftStore();

  const analyze = useCallback(
    async (input: AnalyzeInput, onError?: (msg: string) => void): Promise<void> => {
      if (isAnalyzing) return;
      setIsAnalyzing(true);

      try {
        let location: { lat: number; lng: number } | null = null;

        if (Platform.OS !== 'web') {
          try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              location = { lat: loc.coords.latitude, lng: loc.coords.longitude };
            }
          } catch {
            // location is optional — continue without it
          }
        }

        const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
          'analyze-item',
          { body: { ...input, location, preferences } },
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

        const { data: savedScan, error: saveError } = await supabase
          .from('scans')
          .insert({
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
          })
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
        const msg = err instanceof Error ? err.message : 'Analysis failed. Try again.';
        onError?.(msg);
      } finally {
        setIsAnalyzing(false);
      }
    },
    [isAnalyzing, preferences],
  );

  return { analyze, isAnalyzing };
}
