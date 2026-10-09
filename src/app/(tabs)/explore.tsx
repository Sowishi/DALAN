import { StyleSheet, View } from 'react-native';

import { CityMap } from '@/components/city-map';

export default function ExploreScreen() {
  return (
    <View style={styles.container}>
      <CityMap style={styles.map} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
