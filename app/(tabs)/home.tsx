import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '@/components/NavHeader';

const { width, height } = Dimensions.get('window');
const iconSize = width * 0.17; // slightly smaller for visual balance

const menuItems = [
  { title: 'Notes', image: require('../../assets/notes.png'), route: '/notes' },
  { title: 'Contacts', image: require('../../assets/contacts.png'), route: '/contacts' },
  { title: 'Chat', image: require('../../assets/photos.png'), route: '/photos' },
  { title: 'Supplies', image: require('../../assets/supplies.png'), route: '/supplies' },
  { title: 'Food', image: require('../../assets/food.png'), route: '/food' },
  { title: 'Action Needed', image: require('../../assets/action.png'), route: '/action' },
  { title: 'Documents', image: require('../../assets/documents.png'), route: '/documents' },
  { title: 'Rx', image: require('../../assets/rx.png'), route: '/rx' },
  { title: 'Emergency', image: require('../../assets/ambulance.png'), route: '/ambulance' },
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
    paddingTop: height * 0.05,
    paddingBottom: height * 0.06,
    paddingHorizontal: width * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    width: width / 3.3, // ensures 3 per row with even spacing
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height * 0.015,
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
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
    fontSize: width * 0.04,
    color: '#000',
  },
});











