import { AntDesign } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  Keyframe,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/haptic-pressable';
import { ThemedText } from '@/components/themed-text';
import { Brand, Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-provider';

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
    transform: [{ translateY: 24 }],
  },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }],
    easing: Easing.out(Easing.cubic),
  },
});

type EmailAuthScreenProps = {
  mode: 'login' | 'signup';
};

export function EmailAuthScreen({ mode }: EmailAuthScreenProps) {
  const { user, ready, signIn, signUp, signInWithGoogle, continueAsGuest } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState<'email' | 'google' | 'guest' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSignup = mode === 'signup';

  // Gentle, continuous float for the logo.
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [float]);
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(float.value, [0, 1], [0, -8]) }],
  }));

  if (ready && user) {
    return <Redirect href="/ask" />;
  }

  const validate = () => {
    if (isSignup && !name.trim()) return 'Enter your name.';
    if (!email.trim()) return 'Enter your email.';
    if (!password) return 'Enter your password.';
    if (isSignup && password.length < 6) return 'Use at least 6 characters for your password.';
    if (isSignup && password !== confirm) return 'Passwords do not match.';
    return null;
  };

  const submit = async () => {
    if (pending) return;
    const nextError = validate();
    if (nextError) {
      setError(nextError);
      return;
    }

    setPending('email');
    setError(null);
    const message = isSignup
      ? await signUp(name, email, password)
      : await signIn(email, password);
    if (message) setError(message);
    setPending(null);
  };

  const onGoogle = async () => {
    if (pending) return;
    setPending('google');
    setError(null);
    const message = await signInWithGoogle();
    if (message) setError(message);
    setPending(null);
  };

  const onGuest = async () => {
    if (pending) return;
    setPending('guest');
    setError(null);
    const message = await continueAsGuest();
    if (message) setError(message);
    setPending(null);
  };

  return (
    <View style={styles.container}>
      <Image
        style={StyleSheet.absoluteFill}
        source={require('@/assets/images/splash_screen_bg.jpg')}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <LinearGradient
        colors={['rgba(232,247,241,0.15)', 'rgba(232,247,241,0.75)', 'rgba(255,255,255,0.97)']}
        locations={[0, 0.45, 0.82]}
        style={StyleSheet.absoluteFill}
      />

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
              <Animated.View style={floatStyle}>
                <Image
                  style={styles.logo}
                  source={require('@/assets/images/dalan.png')}
                  contentFit="contain"
                  accessibilityLabel="DALAN"
                />
              </Animated.View>
              <ThemedText type="subtitle" style={styles.heading}>
                {isSignup ? 'Create your account' : 'Welcome back'}
              </ThemedText>
              <ThemedText type="small" style={styles.subtitle}>
                {isSignup
                  ? 'Register with your email to get started'
                  : 'Find your way, every journey'}
              </ThemedText>
            </Animated.View>

            <Animated.View
              entering={formEntrance.duration(550).delay(220)}
              style={styles.formCard}>
              {isSignup ? (
                <View style={styles.field}>
                  <ThemedText type="smallBold" style={styles.label}>
                    Name
                  </ThemedText>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={C.textSecondary}
                    autoCapitalize="words"
                    autoComplete="name"
                    returnKeyType="next"
                    style={styles.input}
                  />
                </View>
              ) : null}

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
                  autoComplete={isSignup ? 'new-password' : 'password'}
                  secureTextEntry
                  returnKeyType={isSignup ? 'next' : 'done'}
                  onSubmitEditing={isSignup ? undefined : () => void submit()}
                  style={styles.input}
                />
              </View>

              {isSignup ? (
                <View style={styles.field}>
                  <ThemedText type="smallBold" style={styles.label}>
                    Confirm password
                  </ThemedText>
                  <TextInput
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="••••••••"
                    placeholderTextColor={C.textSecondary}
                    autoCapitalize="none"
                    autoComplete="new-password"
                    secureTextEntry
                    returnKeyType="done"
                    onSubmitEditing={() => void submit()}
                    style={styles.input}
                  />
                </View>
              ) : null}

              {!isSignup ? (
                <Pressable accessibilityRole="button" onPress={() => {}} style={styles.forgotRow}>
                  <ThemedText type="linkPrimary">Forgot password?</ThemedText>
                </Pressable>
              ) : null}

              {error ? (
                <ThemedText type="small" style={styles.error}>
                  {error}
                </ThemedText>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={pending !== null || !ready}
                onPress={() => void submit()}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { opacity: pressed || pending !== null ? 0.85 : 1 },
                ]}>
                {pending === 'email' ? (
                  <ActivityIndicator color={Brand.white} />
                ) : (
                  <ThemedText type="smallBold" style={styles.primaryButtonLabel}>
                    {isSignup ? 'Create account' : 'Sign In'}
                  </ThemedText>
                )}
              </Pressable>

              {!isSignup ? (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <ThemedText type="small" style={styles.dividerLabel}>
                      or
                    </ThemedText>
                    <View style={styles.divider} />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Continue with Google"
                    disabled={pending !== null || !ready}
                    onPress={() => void onGoogle()}
                    style={({ pressed }) => [
                      styles.googleButton,
                      { opacity: pressed || pending !== null ? 0.7 : 1 },
                    ]}>
                    {pending === 'google' ? (
                      <ActivityIndicator color={Brand.green} />
                    ) : (
                      <View style={styles.googleContent}>
                        <AntDesign name="google" size={18} color={Brand.green} />
                        <ThemedText type="smallBold" style={styles.googleButtonLabel}>
                          Continue with Google
                        </ThemedText>
                      </View>
                    )}
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Continue as guest"
                    disabled={pending !== null || !ready}
                    onPress={() => void onGuest()}
                    style={({ pressed }) => [
                      styles.guestButton,
                      { opacity: pressed || pending !== null ? 0.6 : 1 },
                    ]}>
                    {pending === 'guest' ? (
                      <ActivityIndicator color={C.textSecondary} />
                    ) : (
                      <ThemedText type="smallBold" style={styles.guestButtonLabel}>
                        Continue as guest
                      </ThemedText>
                    )}
                  </Pressable>
                </>
              ) : null}
            </Animated.View>

            <View style={styles.footer}>
              <ThemedText type="small" style={styles.footerText}>
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => (isSignup ? router.replace('/') : router.push('/signup'))}>
                <ThemedText type="linkPrimary">{isSignup ? 'Sign in' : 'Sign up'}</ThemedText>
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
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.five,
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
  formCard: {
    width: '100%',
    gap: Spacing.three,
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderRadius: Spacing.four,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.9)',
    padding: Spacing.four,
    shadowColor: Brand.green,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    color: C.text,
    borderWidth: 1,
    borderColor: C.backgroundSelected,
  },
  forgotRow: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
  },
  error: {
    color: '#C41E3A',
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
    shadowColor: Brand.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
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
  googleButton: {
    width: '100%',
    height: 52,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.white,
    borderWidth: 1.5,
    borderColor: Brand.green,
  },
  googleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  googleButtonLabel: {
    color: Brand.green,
    fontSize: 16,
  },
  guestButton: {
    width: '100%',
    height: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButtonLabel: {
    color: C.textSecondary,
    fontSize: 15,
  },
  footer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    color: C.textSecondary,
    textAlign: 'center',
  },
});
