import { Pressable as RNPressable, type PressableProps } from 'react-native';

import { pressHaptic } from '@/utils/haptics';

export function Pressable({ onPressIn, disabled, ...rest }: PressableProps) {
  return (
    <RNPressable
      {...rest}
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) pressHaptic();
        onPressIn?.(event);
      }}
    />
  );
}
