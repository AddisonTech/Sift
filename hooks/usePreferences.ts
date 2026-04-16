import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { defaultPreferences } from '../lib/utils';
import type { UserPreferences } from '../lib/types';

interface PreferencesState {
  preferences: UserPreferences;
  updatePreferences: (partial: Partial<UserPreferences>) => Promise<void>;
  loading: boolean;
}

export function usePreferences(): PreferencesState {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!cancelled && data) {
        setPreferences({
          price_weight: data.price_weight,
          quality_weight: data.quality_weight,
          ethics_weight: data.ethics_weight,
          health_weight: data.health_weight,
          speed_weight: data.speed_weight,
          dietary: data.dietary ?? [],
          budget: data.budget,
          distance_radius_km: data.distance_radius_km,
          avoid_chains: data.avoid_chains,
        });
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const updatePreferences = useCallback(async (partial: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...partial }));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_preferences')
      .update({
        ...partial,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  }, []);

  return { preferences, updatePreferences, loading };
}
