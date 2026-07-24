import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NavHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeWrap, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Image
          source={require('../assets/app-logo2.png')} // TODO: replace with your real logo path
          style={styles.logo}
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
    height: 68,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  logo: {
    width: 125,
    height: 67,
  },
});













