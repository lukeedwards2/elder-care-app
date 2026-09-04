import React from 'react';
import {
  View,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NavHeader() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  // Use a larger logo/header only on tablet-sized screens.
  // iPhone keeps the exact sizing it already has.
  const isTablet = width >= 768;

  const headerHeight = isTablet ? 76 : 68;
  const logoWidth = isTablet ? 155 : 125;
  const logoHeight = isTablet ? 74 : 67;

  return (
    <View style={[styles.safeWrap, { paddingTop: insets.top }]}>
      <View
        style={[
          styles.header,
          {
            height: headerHeight,
          },
        ]}
      >
        <Image
          source={require('../assets/app-logo2.png')}
          style={{
            width: logoWidth,
            height: logoHeight,
          }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeWrap: {
    backgroundColor: '#1976D2',
  },

  header: {
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
});













