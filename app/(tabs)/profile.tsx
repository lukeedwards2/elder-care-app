import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '../../components/NavHeader';

const options = [
  { label: 'Profile', route: '/profileInfo' },
  { label: 'Subscriptions', route: '/subscription' },
  { label: 'Team Members', route: '/team-members' },
  { label: 'Amazon Links', route: '/account/amazon-links' },
  { label: 'About Us', route: '/aboutUs' },
  { label: 'Contact Us', route: '/contactUs' },
];

export default function AccountScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavHeader
        title="Account"
        helpText="Manage your account settings and view information about the CareKeeper Hub."
      />

      <FlatList
        data={options}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(item.route)}
          >
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f9fc' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
});

