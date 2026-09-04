import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '@/components/NavHeader';

const menuItems = [
  {
    title: 'Notes',
    image: require('../../assets/notes.png'),
    route: '/(tabs)/notes',
  },
  {
    title: 'Contacts',
    image: require('../../assets/contacts.png'),
    route: '/(tabs)/contacts',
  },
  {
    title: 'Chat',
    image: require('../../assets/photos.png'),
    route: '/(tabs)/photos',
  },
  {
    title: 'Supplies',
    image: require('../../assets/supplies.png'),
    route: '/(tabs)/supplies',
  },
  {
    title: 'Food',
    image: require('../../assets/food.png'),
    route: '/(tabs)/food',
  },
  {
    title: 'Action Needed',
    image: require('../../assets/action.png'),
    route: '/(tabs)/action',
  },
  {
    title: 'Documents',
    image: require('../../assets/documents.png'),
    route: '/(tabs)/documents',
  },
  {
    title: 'Rx',
    image: require('../../assets/rx.png'),
    route: '/(tabs)/rx',
  },
  {
    title: 'Emergency',
    image: require('../../assets/ambulance.png'),
    route: '/(tabs)/ambulance',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;

  /*
   * iPhone:
   * Keep the grid close to the current design.
   *
   * iPad:
   * Allow the grid to use much more of the available width,
   * but still cap it so icons never become enormous.
   */
  const gridWidth = isTablet
    ? Math.min(width * 0.9, 940)
    : width;

  const itemWidth = gridWidth / 3;

  /*
   * Let tablet icons be somewhat larger than before,
   * while still keeping a hard maximum.
   */
  const iconSize = isTablet
    ? Math.min(itemWidth * 0.4, 115)
    : Math.min(width * 0.17, 72);

  const labelSize = isTablet
    ? 20
    : Math.min(width * 0.039, 16);

  /*
   * iPhone keeps its familiar spacing.
   *
   * Tablet rows will be vertically distributed using
   * justifyContent: 'space-evenly' below.
   */
  const phoneVerticalSpacing = Math.min(height * 0.038, 34);

  const phoneTopPadding = Math.min(height * 0.055, 46);

  return (
    <View style={styles.container}>
      <NavHeader />

      <FlatList
        data={menuItems}
        numColumns={3}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.grid,
          {
            width: gridWidth,
          },
          isTablet
            ? styles.tabletGrid
            : {
                paddingTop: phoneTopPadding,
                paddingBottom: 24,
              },
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                width: itemWidth,
              },
              !isTablet && {
                marginVertical: phoneVerticalSpacing,
              },
            ]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconWrapper,
                {
                  width: iconSize * 1.1,
                  height: iconSize * 1.1,
                },
              ]}
            >
              <Image
                source={item.image}
                style={{
                  width: iconSize,
                  height: iconSize,
                }}
                resizeMode="contain"
              />
            </View>

            <Text
              style={[
                styles.label,
                {
                  fontSize: labelSize,
                },
              ]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  grid: {
    alignSelf: 'center',
    alignItems: 'center',
  },

  /*
   * This is the major iPad improvement.
   *
   * flexGrow makes the FlatList content fill the available
   * vertical area between the header and bottom tabs.
   *
   * space-evenly spreads the three rows through that area
   * rather than stacking them near the top.
   */
  tabletGrid: {
    flexGrow: 1,
    justifyContent: 'space-evenly',
    paddingVertical: 24,
  },

  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    color: '#000',
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif-light',
    }),
  },
});
















