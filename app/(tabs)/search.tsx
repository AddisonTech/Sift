import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalyzePipeline } from '../../hooks/useAnalyzePipeline';
import { colors } from '../../lib/theme';

const SUGGESTIONS: { icon: string; label: string }[] = [
  { icon: '👟', label: 'Best running shoes under $100' },
  { icon: '🥗', label: 'Healthy lunch near me' },
  { icon: '🎧', label: 'Wireless earbuds for working out' },
  { icon: '☕', label: 'Coffee shop with fast wifi' },
];

function SearchIcon({ size = 20, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={7} stroke={color} strokeWidth={2} />
      <Path d="M17 17l3.5 3.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const { analyze, isAnalyzing } = useAnalyzePipeline();

  const buttonScale = useSharedValue(1);
  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleSubmit = async () => {
    const trimmed = query.trim();
    if (!trimmed || isAnalyzing) return;

    setError(null);
    buttonScale.value = withSequence(
      withTiming(0.94, { duration: 80 }),
      withTiming(1, { duration: 160, easing: Easing.out(Easing.cubic) }),
    );
    inputRef.current?.blur();

    await analyze({ textQuery: trimmed }, setError);
  };

  const handleSuggestion = (label: string) => {
    setQuery(label);
    inputRef.current?.focus();
  };

  const canSubmit = query.trim().length > 0 && !isAnalyzing;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 20, paddingBottom: 8 }}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: '800',
              color: colors.text,
              letterSpacing: -1,
            }}
          >
            Search
          </Text>
          <Text style={{ color: colors.subtle, fontSize: 13, marginTop: 3 }}>
            Evaluate anything with a description
          </Text>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>

          {/* Search input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: focused ? `${colors.primary}60` : colors.border,
              paddingHorizontal: 14,
              paddingVertical: 14,
              gap: 10,
            }}
          >
            <SearchIcon color={focused ? colors.primary : colors.subtle} size={18} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="What are you looking for?"
              placeholderTextColor={colors.placeholder}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 15,
                fontWeight: '400',
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={handleSubmit}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              editable={!isAnalyzing}
              multiline={false}
            />
            {query.length > 0 && !isAnalyzing && (
              <Pressable
                onPress={() => setQuery('')}
                hitSlop={8}
                style={{ padding: 2 }}
              >
                <Text style={{ color: colors.subtle, fontSize: 16, lineHeight: 18 }}>×</Text>
              </Pressable>
            )}
          </View>

          {/* Submit button */}
          <Animated.View style={[{ marginTop: 12 }, buttonStyle]}>
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={({ pressed }) => ({
                borderRadius: 16,
                overflow: 'hidden',
                opacity: canSubmit ? 1 : 0.4,
              })}
            >
              <LinearGradient
                colors={canSubmit ? [colors.primary, '#8B6AFF'] : [colors.surface, colors.surface]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                }}
              >
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator size="small" color={colors.text} />
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
                      Analyzing…
                    </Text>
                  </>
                ) : (
                  <>
                    <SearchIcon color={canSubmit ? colors.text : colors.subtle} size={16} />
                    <Text
                      style={{
                        color: canSubmit ? colors.text : colors.subtle,
                        fontWeight: '700',
                        fontSize: 15,
                      }}
                    >
                      Analyze
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Error */}
          {error && (
            <View
              style={{
                marginTop: 10,
                backgroundColor: `${colors.danger}1F`,
                borderWidth: 1,
                borderColor: `${colors.danger}40`,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center' }}>
                {error}
              </Text>
            </View>
          )}

          {/* Suggestions */}
          {!isAnalyzing && (
            <View style={{ marginTop: 32 }}>
              <Text
                style={{
                  color: colors.subtle,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  marginBottom: 12,
                  paddingHorizontal: 2,
                }}
              >
                Try searching for
              </Text>
              {SUGGESTIONS.map(({ icon, label }) => (
                <Pressable
                  key={label}
                  onPress={() => handleSuggestion(label)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: pressed ? colors.card : colors.surface,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    marginBottom: 8,
                  })}
                >
                  <Text style={{ fontSize: 18 }}>{icon}</Text>
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 13,
                      fontWeight: '500',
                      flex: 1,
                    }}
                  >
                    {label}
                  </Text>
                  <Text style={{ color: colors.border, fontSize: 16 }}>›</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
