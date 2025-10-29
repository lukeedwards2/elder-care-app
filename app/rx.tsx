import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, Modal, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import NavHeader from '../components/NavHeader';

export default function RxScreen() {
  const [rxList, setRxList] = useState([]);
  const [selectedRxIds, setSelectedRxIds] = useState([]);
  const [helpVisible, setHelpVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadRx();
  }, []);

  const loadRx = async () => {
    const saved = await AsyncStorage.getItem('stored_rx');
    if (saved) setRxList(JSON.parse(saved));

    const storedAmbulance = await AsyncStorage.getItem('ambulance_rx');
    if (storedAmbulance) {
      const parsed = JSON.parse(storedAmbulance);
      const ids = parsed.map(item => item.rxNumber);
      setSelectedRxIds(ids);
    }
  };

  const toggleRxCheckbox = async (item) => {
    const current = await AsyncStorage.getItem('ambulance_rx');
    let updated = current ? JSON.parse(current) : [];

    const isAlreadySelected = selectedRxIds.includes(item.rxNumber);

    if (isAlreadySelected) {
      updated = updated.filter(rx => rx.rxNumber !== item.rxNumber);
    } else {
      updated.push(item);
    }

    await AsyncStorage.setItem('ambulance_rx', JSON.stringify(updated));
    const newSelectedIds = updated.map(rx => rx.rxNumber);
    setSelectedRxIds(newSelectedIds);
  };

  return (
    <View style={styles.container}>
      <NavHeader
        title="Prescriptions"
        subtitle="Medication List"
        onHelpPress={() => setHelpVisible(true)}
      />

      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Rx Page</Text>
            <Text style={styles.helpText}>
              Use this page to manage prescription medications. Tap a medication to see full details. You can also select medications to include on the ambulance info page.
            </Text>
            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/rxDetail')}
      >
        <Text style={styles.addButtonText}>ADD NEW</Text>
      </TouchableOpacity>

      <FlatList
        data={rxList}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.rxItem}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                router.push({
                  pathname: '/rxDetail',
                  params: { ...item, index },
                })
              }
            >
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.image} />
              )}
              <View style={styles.textContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.purpose}>{item.purpose}</Text>
                <Text style={styles.frequency}>Take: {item.frequency}</Text>
              </View>
            </TouchableOpacity>

            <Checkbox
              value={selectedRxIds.includes(item.rxNumber)}
              onValueChange={() => toggleRxCheckbox(item)}
              style={styles.checkbox}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  addButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  rxItem: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  name: { fontSize: 18, fontWeight: 'bold' },
  purpose: { fontSize: 14, color: '#555' },
  frequency: { fontSize: 14, color: '#333' },
  checkbox: {
    marginLeft: 10,
    width: 22,
    height: 22,
    borderColor: '#444',
    borderWidth: 1,
    borderRadius: 4,
  },
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxWidth: 350,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
