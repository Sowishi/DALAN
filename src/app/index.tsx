import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Motion, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={() => {
        scale.set(withSpring(0.97, Motion.spring));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, Motion.spring));
      }}
      onPress={onPress}
      style={[
        styles.primaryButton,
        { backgroundColor: theme.text, opacity: disabled ? 0.5 : 1 },
        animatedStyle,
      ]}>
      <ThemedText style={[styles.primaryButtonLabel, { color: theme.background }]}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

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
        <SafeAreaView style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedView style={styles.header}>
              <ThemedText type="title" style={styles.brand}>
                DALAN
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.subtitle}>
                Sign in to continue
              </ThemedText>
            </ThemedView>

            <ThemedView style={styles.form}>
              <ThemedView style={styles.field}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Email
                </ThemedText>
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
                    { backgroundColor: theme.backgroundElement, color: theme.text },
                  ]}
                />
              </ThemedView>

              <ThemedView style={styles.field}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Password
                </ThemedText>
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
                    { backgroundColor: theme.backgroundElement, color: theme.text },
                  ]}
                />
              </ThemedView>

              <Pressable
                accessibilityRole="button"
                onPress={() => {}}
                style={styles.forgotRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  Forgot password?
                </ThemedText>
              </Pressable>

              <PrimaryButton label="Sign In" onPress={handleLogin} disabled={!canSubmit} />
            </ThemedView>

            <ThemedView style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                Don&apos;t have an account?{' '}
              </ThemedText>
              <Pressable accessibilityRole="button" onPress={() => {}}>
                <ThemedText type="smallBold">Sign up</ThemedText>
              </Pressable>
            </ThemedView>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    gap: Spacing.five,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  brand: {
    letterSpacing: 2,
  },
  subtitle: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  input: {
    height: 52,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    fontFamily: Fonts.sans,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.one,
  },
  primaryButton: {
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
