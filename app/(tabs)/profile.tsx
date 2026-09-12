// app/(tabs)/profile.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import NavHeader from '@/components/NavHeader';

type AccountOption = {
  label: string;
  route: Href;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

const options: AccountOption[] = [
  {
    label: 'Profile',
    route: '/(tabs)/profileInfo',
    icon: 'person-outline',
    description: 'View and update your profile information',
  },
  {
    label: 'Subscriptions',
    route: '/(tabs)/subscription',
    icon: 'diamond-outline',
    description: 'Manage your CareKeeperHub Premium subscription',
  },
  {
    label: 'Team Members',
    route: '/(tabs)/team-members',
    icon: 'people-outline',
    description: 'View and manage your care team',
  },
  {
    label: 'About Us',
    route: '/(tabs)/aboutUs',
    icon: 'information-circle-outline',
    description: 'Learn more about CareKeeperHub',
  },
  {
    label: 'Contact Us',
    route: '/(tabs)/contactUs',
    icon: 'mail-outline',
    description: 'Get in touch with CareKeeperHub',
  },
];

export default function AccountScreen() {
  const router = useRouter();

  const handlePress = (route: Href) => {
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <NavHeader />

      <View style={styles.headingContainer}>
        <Text style={styles.heading}>Account</Text>
        <Text style={styles.subheading}>
          Manage your profile, subscription, team, and account information.
        </Text>
      </View>

      <FlatList
        data={options}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => handlePress(item.route)}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon}
                size={25}
                color="#1976D2"
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.cardTitle}>{item.label}</Text>
              <Text style={styles.cardDescription}>
                {item.description}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#9AA4AE"
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  headingContainer: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 12,
  },

  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#20252B',
    marginBottom: 5,
  },

  subheading: {
    fontSize: 15,
    lineHeight: 21,
    color: '#66727D',
  },

  list: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 32,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 17,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 12,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  textContainer: {
    flex: 1,
    paddingRight: 10,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#242A30',
    marginBottom: 3,
  },

  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#77828C',
  },
});



