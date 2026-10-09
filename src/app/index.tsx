import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
            <ThemedView style={styles.heroSection}>
              <AnimatedIcon />
              <ThemedText type="title" style={styles.title}>
                DALAN
              </ThemedText>
            </ThemedView>

            <ThemedText type="code" style={styles.code}>
              sign in
            </ThemedText>

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
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    flexGrow: 1,
    alignSelf: 'stretch',
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    minHeight: 200,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
    alignSelf: 'center',
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
    backgroundColor: '#3c87f7',
  },
  primaryButtonLabel: {
    color: '#ffffff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: Spacing.three,
  },
});
