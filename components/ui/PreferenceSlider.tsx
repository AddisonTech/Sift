import React from 'react';
import { View, Pressable } from 'react-native';
import { colors } from '../../lib/theme';

interface PreferenceSliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function PreferenceSlider({
  value,
  onValueChange,
  min = 1,
  max = 10,
}: PreferenceSliderProps) {
  const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      {steps.map((step) => {
        const active = step <= value;
        const selected = step === value;
        return (
          <Pressable
            key={step}
            onPress={() => onValueChange(step)}
            hitSlop={8}
            style={{
              flex: 1,
              height: active ? 8 : 6,
              borderRadius: 4,
              backgroundColor: active ? colors.primary : '#242424',
              ...(selected && {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 4,
                elevation: 4,
              }),
            }}
          />
        );
      })}
    </View>
  );
}
