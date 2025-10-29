// app/contacts.tsx

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Pressable, Image, Alert, Linking
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import NavHeader from '../components/NavHeader';

export default function ContactsScreen() {
  const router = useRouter();
  const routeParams = useLocalSearchParams();
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [group, setGroup] = useState('Family');
  const [address, setAddress] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [error, setError] = useState('');
  const CONTACTS_KEY = 'stored_contacts';

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    // Handle pre-filled modal from contactDetail.tsx
    if (routeParams.editIndex !== undefined) {
      setName(routeParams.name || '');
      setPhone(routeParams.phone || '');
      setEmail(routeParams.email || '');
      setGroup(routeParams.group || 'Family');
      setAddress(routeParams.address || '');
      setEditingIndex(Number(routeParams.editIndex));
      setModalVisible(true);
    }
  }, [routeParams]);

  const loadContacts = async () => {
    const saved = await AsyncStorage.getItem(CONTACTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setContacts(sortContacts(parsed));
    }
  };

  const saveToStorage = async (updated) => {
    const sorted = sortContacts(updated);
    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(sorted));
    setContacts(sorted);
  };

  const openModal = () => {
    setName('');
    setPhone('');
    setEmail('');
    setGroup('Family');
    setAddress('');
    setEditingIndex(null);
    setError('');
    setModalVisible(true);
  };

  const handleEdit = (index) => {
    const contact = contacts[index];
    setName(contact.name);
    setPhone(contact.phone);
    setEmail(contact.email);
    setGroup(contact.group || 'Family');
    setAddress(contact.address || '');
    setEditingIndex(index);
    setError('');
    setModalVisible(true);
  };

  const saveContact = () => {
    if (!name || !phone || !email) {
      setError('Please fill out name, phone, and email.');
      return;
    }

    const newContact = { name, phone, email, group, address };
    const updated = editingIndex !== null
      ? contacts.map((c, i) => (i === editingIndex ? newContact : c))
      : [...contacts, newContact];

    saveToStorage(updated);
    setModalVisible(false);
  };

  const handleDelete = (index) => {
    const updated = [...contacts];
    updated.splice(index, 1);
    saveToStorage(updated);
  };

  const handleCall = (phone) => phone && Linking.openURL(`tel:${phone}`);
  const handleEmail = (email) => email && Linking.openURL(`mailto:${email}`);

  const handleDirections = async (address) => {
    if (!address) return;
    const encodedAddress = encodeURIComponent(address);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return alert('Location permission is required.');

    const location = await Location.getCurrentPositionAsync({});
    const origin = `${location.coords.latitude},${location.coords.longitude}`;

    Alert.alert('Choose Map App', 'Which app would you like to use?', [
      {
        text: 'Apple Maps',
        onPress: () =>
          Linking.openURL(`http://maps.apple.com/?saddr=${origin}&daddr=${encodedAddress}`),
      },
      {
        text: 'Google Maps',
        onPress: () =>
          Linking.openURL(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodedAddress}`),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const getGroupColor = (group) => {
    switch (group) {
      case 'Family': return '#DCEEFB';
      case 'Friends': return '#D3F9D8';
      case 'Doctors': return '#EADFFD';
      case 'Financial Assistance': return '#FFF8DC';
      default: return '#eee';
    }
  };

  const sortContacts = (list) => {
    const order = {
      Family: 1,
      Friends: 2,
      Doctors: 3,
      'Financial Assistance': 4,
    };
    return list.sort((a, b) => {
      const groupDiff = order[a.group] - order[b.group];
      return groupDiff !== 0
        ? groupDiff
        : a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  return (
    <View style={styles.container}>
      <NavHeader
        title="Contacts Page"
        helpText="This page stores important contacts related to your loved one. You can add family, doctors, and other support contacts. Tap a row for details or use the icons to call, email, or get directions."
        helpVisible={helpVisible}
        setHelpVisible={setHelpVisible}
      />

      <TouchableOpacity style={styles.addButton} onPress={openModal}>
        <Text style={styles.addButtonText}>+ ADD CONTACT</Text>
      </TouchableOpacity>

      <FlatList
        data={contacts}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={[styles.contactRow, { backgroundColor: getGroupColor(item.group) }]}>
            <TouchableOpacity
              style={styles.contactInfo}
              onPress={() =>
                router.push({ pathname: '/contactDetail', params: { ...item, index } })
              }
              onLongPress={() => handleEdit(index)}
            >
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.groupLabel}>{item.group}</Text>
            </TouchableOpacity>
            <View style={styles.iconActions}>
              <TouchableOpacity onPress={() => handleCall(item.phone)}>
                <Image source={require('../assets/phone.png')} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEmail(item.email)}>
                <Image source={require('../assets/email.png')} style={styles.icon} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDirections(item.address)}>
                <Image source={require('../assets/home.png')} style={styles.icon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editingIndex !== null ? 'Edit Contact' : 'New Contact'}
            </Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Street Address (optional)" value={address} onChangeText={setAddress} />
            <TextInput style={styles.input} placeholder="Group (Family, Friends, Doctors...)" value={group} onChangeText={setGroup} />

            <Pressable style={styles.saveButton} onPress={saveContact}>
              <Text style={styles.saveButtonText}>Save Contact</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  addButton: {
    backgroundColor: '#444',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
  },
  contactInfo: { flex: 1 },
  contactName: { fontWeight: 'bold', fontSize: 18 },
  groupLabel: { fontSize: 13, fontStyle: 'italic', color: '#666', marginTop: 2 },
  iconActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  icon: { width: 22, height: 22 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20,
  },
  modalBox: {
    backgroundColor: '#fff', padding: 20, borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center',
  },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#1976D2', padding: 14, borderRadius: 8, alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff', fontWeight: 'bold',
  },
  error: {
    color: 'red', marginBottom: 10, textAlign: 'center',
  },
});


