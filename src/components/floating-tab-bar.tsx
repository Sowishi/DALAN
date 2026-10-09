import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Colors, FloatingTab } from '@/constants/theme';
import { pressHaptic } from '@/utils/haptics';

const C = Colors.light;

// Soft green wash behind the active tab.
const ACTIVE_WASH = 'rgba(1, 81, 68, 0.10)';
const HAIRLINE = 'rgba(0, 0, 0, 0.06)';

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

export function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 12);

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const descriptor = descriptors[route.key];
          const { options } = descriptor;
          const focused = state.index === index;

          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const color = focused ? Brand.green : C.textSecondary;

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
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.item}>
              <View style={[styles.itemInner, focused && styles.itemInnerActive]}>
                {options.tabBarIcon?.({ focused, color, size: 24 })}
                <Text numberOfLines={1} style={[styles.label, { color }]}>
                  {label}
                </Text>
              </View>
            </Pressable>
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
    gap: 3,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: FloatingTab.itemRadius,
    backgroundColor: 'transparent',
  },
  itemInnerActive: {
    backgroundColor: ACTIVE_WASH,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
