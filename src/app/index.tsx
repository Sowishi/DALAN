import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/haptic-pressable';

import { ThemedText } from '@/components/themed-text';
import { Brand, Colors, Fonts, Spacing } from '@/constants/theme';

// Login always renders on a light surface, independent of system dark mode.
const C = Colors.light;

const logoEntrance = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0.8 }],
  },
  60: {
    opacity: 1,
    transform: [{ scale: 1.06 }],
    easing: Easing.elastic(0.9),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.9),
  },
});

const formEntrance = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: 16 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }],
    easing: Easing.out(Easing.cubic),
  },
});

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Anyone can enter — no account or validation required.
  const enterApp = () => {
    router.replace('/explore');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Animated.View entering={logoEntrance.duration(600)} style={styles.heroSection}>
              <Image
                style={styles.logo}
                source={require('@/assets/images/dalan.png')}
                contentFit="contain"
                accessibilityLabel="DALAN"
              />
              <ThemedText type="subtitle" style={styles.heading}>
                Welcome back
              </ThemedText>
              <ThemedText type="small" style={styles.subtitle}>
                Find your way, every journey
              </ThemedText>
            </Animated.View>

            <Animated.View entering={formEntrance.duration(500).delay(250)} style={styles.formBlock}>
              <View style={styles.field}>
                <ThemedText type="smallBold" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={C.textSecondary}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  inputMode="email"
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold" style={styles.label}>
                  Password
                </ThemedText>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={C.textSecondary}
                  autoCapitalize="none"
                  autoComplete="password"
                  secureTextEntry
                  returnKeyType="done"
                  onSubmitEditing={enterApp}
                  style={styles.input}
                />
              </View>

              <Pressable accessibilityRole="button" onPress={() => {}} style={styles.forgotRow}>
                <ThemedText type="linkPrimary">Forgot password?</ThemedText>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={enterApp}
                style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.85 : 1 }]}>
                <ThemedText type="smallBold" style={styles.primaryButtonLabel}>
                  Sign In
                </ThemedText>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <ThemedText type="small" style={styles.dividerLabel}>
                  or
                </ThemedText>
                <View style={styles.divider} />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={enterApp}
                style={({ pressed }) => [styles.guestButton, { opacity: pressed ? 0.7 : 1 }]}>
                <ThemedText type="smallBold" style={styles.guestButtonLabel}>
                  Continue as guest
                </ThemedText>
              </Pressable>
            </Animated.View>

            <View style={styles.footer}>
              <ThemedText type="small" style={styles.subtitle}>
                Don&apos;t have an account?{' '}
              </ThemedText>
              <Pressable accessibilityRole="button" onPress={enterApp}>
                <ThemedText type="linkPrimary">Sign up</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  flex: {
    flex: 1,
    width: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    gap: Spacing.five,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  logo: {
    width: 128,
    height: 128,
  },
  heading: {
    color: C.text,
    textAlign: 'center',
  },
  subtitle: {
    color: C.textSecondary,
    textAlign: 'center',
  },
  formBlock: {
    width: '100%',
    gap: Spacing.three,
  },
  field: {
    width: '100%',
    gap: Spacing.one,
  },
  label: {
    color: C.text,
    alignSelf: 'stretch',
  },
  input: {
    width: '100%',
    height: 52,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: Fonts.sans,
    backgroundColor: C.backgroundElement,
    color: C.text,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
  },
  forgotRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
  },
  primaryButtonLabel: {
    color: Brand.white,
    fontSize: 16,
  },
  dividerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.backgroundSelected,
  },
  dividerLabel: {
    color: C.textSecondary,
  },
  guestButton: {
    width: '100%',
    height: 52,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.white,
    borderWidth: 1.5,
    borderColor: Brand.green,
  },
  guestButtonLabel: {
    color: Brand.green,
    fontSize: 16,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
