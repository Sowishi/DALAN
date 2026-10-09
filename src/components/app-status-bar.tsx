import { StatusBar } from 'expo-status-bar';
import { Platform, StatusBar as RNStatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export const STATUS_BAR_BACKGROUND = Colors.light.background;

export function AppStatusBar() {
  const insets = useSafeAreaInsets();

  if (Platform.OS === 'android') {
    return (
      <RNStatusBar
        backgroundColor={STATUS_BAR_BACKGROUND}
        barStyle="dark-content"
        translucent={false}
      />
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: STATUS_BAR_BACKGROUND,
          zIndex: 100,
        }}
      />
    </>
  );
}
