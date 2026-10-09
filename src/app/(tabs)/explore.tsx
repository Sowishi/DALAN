import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

const C = Colors.light;

export default function ExploreScreen() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
});
