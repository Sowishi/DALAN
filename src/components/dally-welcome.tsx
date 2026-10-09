import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Pressable } from '@/components/haptic-pressable';
import { Colors, Spacing } from '@/constants/theme';

const C = Colors.light;
const ROW_FILL = '#F4F7F6';

export const DALLY_SUGGESTIONS: {
  key: string;
  prompt: string;
  detail: string;
  icon: ImageSource;
}[] = [
  {
    key: 'flood',
    prompt: 'Any flooding nearby?',
    detail: 'Check for flooded roads around you.',
    icon: require('@/assets/images/flood_icon.png'),
  },
  {
    key: 'debris',
    prompt: 'Report debris on the sidewalk',
    detail: 'Let us know about road obstacles.',
    icon: require('@/assets/images/report_icon.png'),
  },
  {
    key: 'route',
    prompt: 'Suggest a safer route',
    detail: 'Find a clearer and safer way to go.',
    icon: require('@/assets/images/suggest_route_icon.png'),
  },
];

type DallyWelcomeProps = {
  disabled?: boolean;
  landscapeHeight?: number;
  onSuggest: (prompt: string) => void;
};

export function DallyWelcome({ disabled, landscapeHeight = 100, onSuggest }: DallyWelcomeProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.heroSpace, { height: landscapeHeight }]} />

      <View style={styles.sheet}>
        <View style={styles.intro}>
          <View style={styles.botWrap}>
            <Image
              source={require('@/assets/images/dally_mascot.png')}
              style={styles.bot}
              contentFit="contain"
              accessibilityLabel="Dally"
            />
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>Hi, I&apos;m Dally</Text>
            <Text style={styles.introBody}>
              I can help you find road hindrances, report issues, and suggest safer routes around
              you.
            </Text>
          </View>
        </View>

        <View style={styles.suggestions}>
          {DALLY_SUGGESTIONS.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={item.prompt}
              accessibilityHint={item.detail}
              accessibilityState={{ disabled: Boolean(disabled) }}
              disabled={disabled}
              onPress={() => onSuggest(item.prompt)}
              style={({ pressed }) => [
                styles.row,
                disabled && styles.rowDisabled,
                pressed && !disabled && styles.pressed,
              ]}>
              <Image source={item.icon} style={styles.rowIcon} contentFit="contain" />
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{item.prompt}</Text>
                <Text style={styles.rowDetail}>{item.detail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#C5C9C8" />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
  },
  heroSpace: {
    marginHorizontal: -Spacing.three,
  },
  sheet: {
    flexGrow: 1,
    marginTop: -28,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    backgroundColor: C.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    gap: Spacing.four,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.one,
  },
  botWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#CEF9E8',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bot: {
    width: 86,
    height: 86,
  },
  introCopy: {
    flex: 1,
    gap: 6,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.4,
  },
  introBody: {
    fontSize: 15,
    lineHeight: 21,
    color: C.textSecondary,
  },
  suggestions: {
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 76,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: ROW_FILL,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowIcon: {
    width: 44,
    height: 44,
  },
  rowCopy: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.text,
    letterSpacing: -0.2,
  },
  rowDetail: {
    fontSize: 13,
    lineHeight: 18,
    color: C.textSecondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
