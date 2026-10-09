import { Image } from 'expo-image';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const handleLogin = () => {
    // TODO: wire up real authentication and navigate to the main app.
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
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
              <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
                Find your way, every journey
              </ThemedText>
            </Animated.View>

            <Animated.View entering={formEntrance.duration(500).delay(250)} style={styles.formBlock}>
              <ThemedView style={styles.codeRow}>
                <ThemedView style={styles.accentBar} />
                <ThemedText type="code" style={styles.code}>
                  sign in
                </ThemedText>
              </ThemedView>

              <ThemedView type="backgroundElement" style={styles.formContainer}>
                <ThemedView style={styles.field}>
                  <ThemedText type="smallBold">Email</ThemedText>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    inputMode="email"
                    returnKeyType="next"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                </ThemedView>

                <ThemedView style={styles.field}>
                  <ThemedText type="smallBold">Password</ThemedText>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="none"
                    autoComplete="password"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={canSubmit ? handleLogin : undefined}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.background,
                        color: theme.text,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}
                  />
                </ThemedView>

                <Pressable accessibilityRole="button" onPress={() => {}} style={styles.forgotRow}>
                  <ThemedText type="linkPrimary">Forgot password?</ThemedText>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmit}
                  onPress={handleLogin}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { opacity: !canSubmit ? 0.5 : pressed ? 0.85 : 1 },
                  ]}>
                  <ThemedText type="smallBold" style={styles.primaryButtonLabel}>
                    Sign In
                  </ThemedText>
                </Pressable>
              </ThemedView>

              <ThemedView style={styles.footer}>
                <ThemedText type="small" themeColor="textSecondary">
                  Don&apos;t have an account?{' '}
                </ThemedText>
                <Pressable accessibilityRole="button" onPress={() => {}}>
                  <ThemedText type="linkPrimary">Sign up</ThemedText>
                </Pressable>
              </ThemedView>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignSelf: 'stretch',
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.four,
    paddingVertical: Spacing.five,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 180,
    height: 180,
  },
  tagline: {
    textAlign: 'center',
  },
  formBlock: {
    alignSelf: 'stretch',
    gap: Spacing.three,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginLeft: Spacing.one,
  },
  accentBar: {
    width: Spacing.four,
    height: 3,
    borderRadius: Spacing.half,
    backgroundColor: Brand.yellow,
  },
  code: {
    textTransform: 'uppercase',
  },
  formContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.four,
    borderRadius: Spacing.four,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    height: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: Fonts.sans,
    borderWidth: StyleSheet.hairlineWidth,
  },
  forgotRow: {
    alignSelf: 'flex-end',
  },
  primaryButton: {
    height: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
    backgroundColor: Brand.green,
  },
  primaryButtonLabel: {
    color: Brand.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
