import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { colors } from '../../lib/theme';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <View className="absolute inset-0 bg-background/90 items-center justify-center z-50">
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text className="text-muted text-sm mt-4">{message}</Text>
      )}
    </View>
  );
}
