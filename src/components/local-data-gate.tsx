import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, AppState, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Brand, Colors, Spacing } from '@/constants/theme';
import { hasFreshLocalData, syncLocalData } from '@/services/local-sync';

const C = Colors.light;
const REFRESH_MS = 15 * 60 * 1000;

export function LocalDataGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const fresh = await hasFreshLocalData();
      if (cancelled) return;
      if (fresh) {
        setReady(true);
        void syncLocalData();
        return;
      }
      await syncLocalData();
      if (!cancelled) setReady(true);
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    const refresh = () => {
      void syncLocalData();
    };
    const timer = setInterval(refresh, REFRESH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [ready]);

  if (!ready) return <Loading />;
  return children;
}

function Loading() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [scale]);

  const pulse = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.screen}>
      <Animated.View style={pulse}>
        <Image
          source={require('@/assets/images/dally_mascot.png')}
          style={styles.mascot}
          contentFit="contain"
          accessibilityLabel="Dally"
        />
      </Animated.View>
      <ActivityIndicator color={Brand.green} />
      <Text style={styles.title}>Getting things ready</Text>
      <Text style={styles.detail}>Saving weather, air, flood, and reports on this phone.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    backgroundColor: C.background,
  },
  mascot: {
    width: 140,
    height: 140,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: C.text,
    textAlign: 'center',
  },
  detail: {
    fontSize: 15,
    lineHeight: 21,
    color: C.textSecondary,
    textAlign: 'center',
  },
});
