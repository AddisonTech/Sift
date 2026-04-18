import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../lib/theme';

function ScanIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: focused ? `${colors.primary}2E` : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2 8V5a2 2 0 012-2h3M2 16v3a2 2 0 002 2h3M16 2h3a2 2 0 012 2v3M16 22h3a2 2 0 002-2v-3"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
        <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
      </Svg>
    </View>
  );
}

function HistoryIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: focused ? `${colors.primary}2E` : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
        <Path d="M12 7v5l3 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

function ProfileIcon({ color, focused }: { color: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: focused ? `${colors.primary}2E` : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
        <Path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 14,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => <ScanIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => <HistoryIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <ProfileIcon color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
