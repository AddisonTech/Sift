import React from 'react';
import { View, Text, Image, Pressable, Linking } from 'react-native';
import type { OnlineAlternative } from '../../lib/types';
import { formatPrice } from '../../lib/utils';

interface OnlineAlternativeCardProps {
  alternative: OnlineAlternative;
}

export default function OnlineAlternativeCard({ alternative }: OnlineAlternativeCardProps) {
  const handleView = () => {
    if (alternative.url) {
      Linking.openURL(alternative.url);
    }
  };

  return (
    <View className="bg-card border border-border rounded-2xl p-4 mb-3 mx-4 flex-row items-center">
      {alternative.image_url ? (
        <Image
          source={{ uri: alternative.image_url }}
          className="w-14 h-14 rounded-xl mr-3 bg-surface"
          resizeMode="cover"
        />
      ) : (
        <View className="w-14 h-14 rounded-xl mr-3 bg-surface items-center justify-center">
          <Text style={{ fontSize: 22 }}>🛍️</Text>
        </View>
      )}
      <View className="flex-1 mr-3">
        <Text className="text-text font-semibold text-sm mb-0.5 leading-tight" numberOfLines={2}>
          {alternative.name}
        </Text>
        <Text className="text-muted text-xs mb-1">{alternative.merchant}</Text>
        <Text className="text-success font-bold text-sm">
          {formatPrice(alternative.price, alternative.currency)}
        </Text>
      </View>
      <Pressable
        onPress={handleView}
        className="bg-primary/20 border border-primary/40 rounded-xl px-3 py-2"
      >
        <Text className="text-primary text-xs font-semibold">View</Text>
      </Pressable>
    </View>
  );
}
