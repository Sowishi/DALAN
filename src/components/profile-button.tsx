import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable as RNPressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Pressable } from '@/components/haptic-pressable';
import { Brand, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-provider';

const C = Colors.light;

type ProfileButtonProps = {
  size?: number;
};

export function ProfileButton({ size = 28 }: ProfileButtonProps) {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name =
    user?.displayName?.trim() ||
    (user?.isAnonymous ? 'Guest' : user?.email?.split('@')[0] || 'Account');
  const email = user?.isAnonymous ? 'No email on this guest session' : user?.email || 'No email';
  const account = user?.isAnonymous ? 'Guest' : 'Email';

  const close = () => {
    if (busy) return;
    setOpen(false);
    setError(null);
  };

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signOut();
    } catch {
      setError('Could not log out. Try again.');
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Profile"
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.photo} contentFit="cover" />
        ) : (
          <Ionicons name="person" size={Math.round(size * 0.46)} color={Brand.white} />
        )}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.modal}>
          <RNPressable style={styles.backdrop} accessibilityLabel="Close profile" onPress={close} />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Account</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={8}>
                <Text style={styles.close}>Done</Text>
              </Pressable>
            </View>

            <View style={styles.identity}>
              <View style={styles.largeAvatar}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.photo} contentFit="cover" />
                ) : (
                  <Ionicons name="person" size={28} color={Brand.white} />
                )}
              </View>
              <Text style={styles.name}>{name}</Text>
            </View>

            <View style={styles.details}>
              <Detail label="Email" value={email} />
              <Detail label="Account" value={account} />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log out"
              disabled={busy}
              onPress={logout}
              style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed, busy && styles.logoutDisabled]}>
              {busy ? (
                <ActivityIndicator color="#E5484D" />
              ) : (
                <Text style={styles.logoutLabel}>Log out</Text>
              )}
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Brand.green,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  modal: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    backgroundColor: C.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.12)',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: C.text,
  },
  close: {
    fontSize: 17,
    color: Brand.green,
  },
  identity: {
    alignItems: 'center',
    gap: 12,
  },
  largeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: Brand.green,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
  },
  details: {
    borderRadius: 12,
    backgroundColor: C.backgroundElement,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 14,
    gap: 2,
  },
  rowLabel: {
    fontSize: 13,
    color: C.textSecondary,
  },
  rowValue: {
    fontSize: 17,
    color: C.text,
  },
  error: {
    fontSize: 13,
    color: '#E5484D',
    textAlign: 'center',
  },
  logout: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.backgroundElement,
  },
  logoutPressed: {
    backgroundColor: C.backgroundSelected,
  },
  logoutDisabled: {
    opacity: 0.6,
  },
  logoutLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#E5484D',
  },
});
