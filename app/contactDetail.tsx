import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ContactDetail() {
  const router = useRouter();
  const { name, phone, email, address, group, index } = useLocalSearchParams();

  const handleCall = () => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = () => {
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const handleDirections = () => {
    if (address) {
      const encoded = encodeURIComponent(address as string);
      Linking.openURL(`http://maps.apple.com/?daddr=${encoded}`);
    }
  };

  const handleDelete = async () => {
    try {
      const stored = await AsyncStorage.getItem('stored_contacts');
      if (!stored) return;
      const contacts = JSON.parse(stored);
      contacts.splice(Number(index), 1);
      await AsyncStorage.setItem('stored_contacts', JSON.stringify(contacts));
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete contact.');
    }
  };

  const handleEdit = () => {
  router.push({
    pathname: '/contacts',
    params: {
      editIndex: index,
      name,
      phone,
      email,
      address,
      group,
    },
  });
};


  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.group}>{group}</Text>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Phone:</Text>
        <Text>{phone}</Text>
        <TouchableOpacity onPress={handleCall}>
          <Image source={require('../assets/phone.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Email:</Text>
        <Text>{email}</Text>
        <TouchableOpacity onPress={handleEmail}>
          <Image source={require('../assets/email.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.label}>Address:</Text>
        <Text>{address}</Text>
        <TouchableOpacity onPress={handleDirections}>
          <Image source={require('../assets/home.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete Contact</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  name: { fontSize: 28, fontWeight: 'bold' },
  group: { fontSize: 16, color: '#555', marginBottom: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  label: { fontWeight: 'bold', width: 70 },
  icon: { width: 20, height: 20 },
  editButton: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#1976D2',
    borderRadius: 8,
    alignItems: 'center',
  },
  editText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  deleteButton: {
    marginTop: 10,
    padding: 14,
    backgroundColor: '#c0392b',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});


