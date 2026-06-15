import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  onHelpPress?: () => void;
};

export default function NavHeader({ onHelpPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeWrap, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.left}>
          {/* TODO: replace with your logo image source */}
          {/* <Image source={require('../assets/logo.png')} style={styles.logo} /> */}
          <View style={styles.logoPlaceholder} />
        </View>

        <Pressable onPress={onHelpPress} hitSlop={12} style={styles.right}>
          {/* TODO: replace with your lightbulb image source */}
          {/* <Image source={require('../assets/lightbulb.png')} style={styles.bulb} /> */}
          <View style={styles.bulbPlaceholder} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // This is what prevents the “white above/edges” issue:
  safeWrap: {
    backgroundColor: '#1976D2',
  },

  // Control header height here (this fixes “blue goes too far down”):
  header: {
    height: 92, // tweak: try 80–96 until it matches your “original”
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',

    // If you want rounded bottom corners:
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1976D2',
  },

  left: { justifyContent: 'flex-end' },
  right: { justifyContent: 'flex-end' },

  // placeholders so it compiles even before you wire images:
  logoPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.35)' },
  bulbPlaceholder: { width: 38, height: 38, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.35)' },
});













