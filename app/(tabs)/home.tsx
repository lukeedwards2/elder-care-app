import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '@/components/NavHeader';

const { width, height } = Dimensions.get('window');

// Dynamic scaling so icons and spacing adjust for different screen sizes
const baseWidth = 390; // reference iPhone 14 width
const scale = width / baseWidth;
const iconSize = width * 0.17 * scale;

const menuItems = [
  { title: 'Notes', image: require('../../assets/notes.png'), route: '/(tabs)/notes' },
  { title: 'Contacts', image: require('../../assets/contacts.png'), route: '/(tabs)/contacts' },
  { title: 'Chat', image: require('../../assets/photos.png'), route: '/(tabs)/photos' },
  { title: 'Supplies', image: require('../../assets/supplies.png'), route: '/(tabs)/supplies' },
  { title: 'Food', image: require('../../assets/food.png'), route: '/(tabs)/food' },
  { title: 'Action Needed', image: require('../../assets/action.png'), route: '/(tabs)/action' },
  { title: 'Documents', image: require('../../assets/documents.png'), route: '/(tabs)/documents' },
  { title: 'Rx', image: require('../../assets/rx.png'), route: '/(tabs)/rx' },
  { title: 'Emergency', image: require('../../assets/ambulance.png'), route: '/(tabs)/ambulance' },
];


export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavHeader
        helpTitle="Home Help"
        helpText="This is your home screen. Tap any icon to manage caregiving tasks like notes, contacts, or medicine reminders."
      />

      <FlatList
        data={menuItems}
        numColumns={3}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push(item.route)}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrapper}>
              <Image source={item.image} style={styles.icon} resizeMode="contain" />
            </View>
            <Text style={styles.label}>{item.title}</Text>
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
    paddingTop: height * 0.06 * scale,
    paddingBottom: height * 0.02 * scale,
    paddingHorizontal: width * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    width: width / 3.3,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height * 0.035 * scale, // vertical spacing unchanged
  },
  iconWrapper: {
    width: iconSize * 1.1,
    height: iconSize * 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: iconSize,
    height: iconSize,
  },
  label: {
    marginTop: 8 * scale,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: width * 0.039,
    color: '#000',
    fontFamily: Platform.select({
      ios: 'Avenir Next', // ✅ modern, sleek, professional iOS font
      android: 'sans-serif-light', // ✅ clean Android alternative
    }),
  },
});

















