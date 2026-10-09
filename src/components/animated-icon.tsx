import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Keyframe,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const overlay = useSharedValue(1);
  const logo = useSharedValue(0);

  useEffect(() => {
    let alive = true;
    const dismiss = () => {
      if (alive) setVisible(false);
    };

    void SplashScreen.hideAsync().catch(() => undefined);

    logo.value = withTiming(1, {
      duration: 780,
      easing: Easing.out(Easing.cubic),
    });
    overlay.value = withDelay(
      1680,
      withTiming(0, { duration: 520, easing: Easing.inOut(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(dismiss)();
      }),
    );

    const fallback = setTimeout(dismiss, 3200);
    return () => {
      alive = false;
      clearTimeout(fallback);
    };
  }, [logo, overlay]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlay.value,
  }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.86 + logo.value * 0.14 }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.splashOverlay, overlayStyle]} pointerEvents="auto">
      <Image
        source={require('@/assets/images/splash_screen_bg.jpg')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        contentPosition="center"
        accessibilityIgnoresInvertColors
      />
      <Animated.View style={logoStyle}>
        <Image
          source={require('@/assets/images/dalan.png')}
          style={styles.brand}
          contentFit="contain"
          accessibilityLabel="DALAN"
        />
      </Animated.View>
    </Animated.View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  brand: {
    width: 196,
    height: 196,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E8F7F1',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    elevation: 2000,
  },
});
