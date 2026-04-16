import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';

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
    <View className="flex-row items-center gap-1">
      {steps.map((step) => (
        <Pressable
          key={step}
          onPress={() => onValueChange(step)}
          style={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: step <= value ? '#6C47FF' : '#2A2A2A',
          }}
          hitSlop={6}
        />
      ))}
    </View>
  );
}
