import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Colors, FloatingTab } from '@/constants/theme';
import { useActivityOverlay } from '@/hooks/use-activity-overlay';
import { pressHaptic } from '@/utils/haptics';

const C = Colors.light;

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
  const current = state.routes[state.index];
  const activityLive = useActivityOverlay();
  if (current?.name === 'report' || activityLive) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const isReport = route.name === 'report';
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

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={() => {
                navigation.emit({ type: 'tabLongPress', target: route.key });
              }}
              style={styles.item}>
              <View style={[styles.itemInner, isReport && styles.reportInner]}>
                {isReport ? (
                  <View style={styles.action}>
                    <Ionicons name="add" size={24} color={Brand.white} />
                  </View>
                ) : (
                  options.tabBarIcon?.({ focused, color, size: 22 })
                )}
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
    paddingTop: FloatingTab.raise,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: FloatingTab.height,
    paddingHorizontal: 8,
    borderRadius: FloatingTab.radius,
    backgroundColor: Brand.white,
    shadowColor: '#000000',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  item: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInner: {
    alignItems: 'center',
    gap: 3,
  },
  reportInner: {
    marginTop: -FloatingTab.raise,
  },
  action: {
    width: FloatingTab.actionSize,
    height: FloatingTab.actionSize,
    borderRadius: FloatingTab.actionSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.green,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
