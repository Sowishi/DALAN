import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppStatusBar } from '@/components/app-status-bar';
import { AuthProvider } from '@/context/auth-provider';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions?.({ duration: 400, fade: true });

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <AppStatusBar />
          <AnimatedSplashOverlay />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
