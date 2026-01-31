import { Brand, Colors, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTranslation } from '@/hooks/useTranslation';
import { Tabs } from 'expo-router';
import { Activity, FileText, Home, MessageCircle, User } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: width > 768,
        tabBarActiveTintColor: Brand.primary,
        tabBarInactiveTintColor: colors.icon,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          // Height calculation:
          // iOS: Fixed 88
          // Android: Base 60 + Navigation Bar inset (if present, e.g. 3-button mode)
          height: Platform.OS === 'ios' ? 88 : 60 + (insets.bottom > 0 ? insets.bottom + 4 : 0),
          paddingTop: 8,
          // Padding Bottom calculation:
          // If insets exist (iPhone X home indicator or Android Nav Bar), use them + buffer
          // Fallback: iOS 28, Android 8
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : (Platform.OS === 'ios' ? 28 : 8),
          ...Shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, focused }) => (
            <Home
              size={22}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="pulse"
        options={{
          title: t('pulse'),
          tabBarIcon: ({ color, focused }) => (
            <Activity
              size={22}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: t('reports'),
          tabBarIcon: ({ color, focused }) => (
            <FileText
              size={22}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          title: t('chat'),
          tabBarIcon: ({ color, focused }) => (
            <MessageCircle
              size={22}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, focused }) => (
            <User
              size={22}
              color={color}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
