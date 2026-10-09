import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Colors, FloatingTab } from '@/constants/theme';
import { pressHaptic } from '@/utils/haptics';

const C = Colors.light;

// Soft green wash behind the active tab.
const ACTIVE_WASH = 'rgba(1, 81, 68, 0.10)';
const HAIRLINE = 'rgba(0, 0, 0, 0.06)';

const SPRING = { damping: 16, stiffness: 180, mass: 0.6 } as const;

type TabIconRenderer = (props: {
  focused: boolean;
  color: ColorValue;
  size: number;
}) => React.ReactNode;

type TabBarDescriptor = {
  options: {
    title?: string;
    tabBarLabel?: unknown;
    tabBarIcon?: TabIconRenderer;
    tabBarAccessibilityLabel?: string;
  };
};

type TabEmitResult = { defaultPrevented: boolean };

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string }[];
  };
  descriptors: Record<string, TabBarDescriptor>;
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => TabEmitResult;
    navigate: (name: string) => void;
  };
};

type TabItemProps = {
  focused: boolean;
  label: string;
  accessibilityLabel: string;
  icon?: TabIconRenderer;
  onPress: () => void;
  onLongPress: () => void;
};

function TabItem({
  focused,
  label,
  accessibilityLabel,
  icon,
  onPress,
  onLongPress,
}: TabItemProps) {
  const active = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    active.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [active, focused]);

  const washStyle = useAnimatedStyle(() => ({
    opacity: active.value,
    transform: [{ scale: 0.9 + active.value * 0.1 }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.06 : 1, SPRING) }],
  }));

  const color = focused ? Brand.green : C.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}>
      <View style={styles.itemInner}>
        <Animated.View style={[styles.wash, washStyle]} />
        <Animated.View style={[styles.content, contentStyle]}>
          {icon?.({ focused, color, size: 24 })}
          <Text numberOfLines={1} style={[styles.label, { color }]}>
            {label}
          </Text>
        </Animated.View>
      </View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = () => {
            pressHaptic();
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={label}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              icon={options.tabBarIcon}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: FloatingTab.inset,
    right: FloatingTab.inset,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: FloatingTab.height,
    paddingHorizontal: 8,
    borderRadius: FloatingTab.radius,
    backgroundColor: C.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  item: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FloatingTab.itemRadius,
    backgroundColor: ACTIVE_WASH,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
