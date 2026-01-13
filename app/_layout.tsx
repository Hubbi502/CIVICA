/**
 * CIVICA Root Layout
 * Handles auth state and navigation routing
 */

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { Brand, Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/authStore';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Custom theme extending default
const CivicaLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Brand.primary,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
  },
};

const CivicaDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Brand.primary,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
  },
};

function useProtectedRoute() {
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { firebaseUser, user, isInitialized, isLoading } = useAuthStore();

  useEffect(() => {
    if (!navigationState?.key || !isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!firebaseUser) {
      // Not logged in, redirect to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (!user) {
      // Logged in but no profile (needs onboarding)
      if (!inOnboardingGroup && !isLoading) {
        router.replace('/(onboarding)/location');
      }
    } else {
      // Logged in with profile, go to main app
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [firebaseUser, user, segments, navigationState?.key, isInitialized, isLoading]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { initialize, isInitialized } = useAuthStore();

  // Initialize auth listener on mount
  useEffect(() => {
    const unsubscribe = initialize();
    return () => unsubscribe();
  }, []);

  // Use protected route hook
  useProtectedRoute();

  // Show loading while initializing auth
  if (!isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme].background }]}>
        <ActivityIndicator size="large" color={Brand.primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? CivicaDarkTheme : CivicaLightTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
