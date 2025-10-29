import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import NavHeader from '../components/NavHeader';
import { Ionicons } from '@expo/vector-icons';

export default function SuppliesScreen() {
  const [supplies, setSupplies] = useState([]);
  const [helpVisible, setHelpVisible] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const router = useRouter();

  useEffect(() => {
    loadSupplies();
  }, []);

  const loadSupplies = async () => {
    const saved = await AsyncStorage.getItem('stored_supplies');
    if (saved) setSupplies(JSON.parse(saved));
  };

  const markAsNeeded = async (item, index) => {
    const current = await AsyncStorage.getItem('stored_actions');
    const parsed = current ? JSON.parse(current) : [];
    const updated = [...parsed, { ...item, quantity: 1 }];
    await AsyncStorage.setItem('stored_actions', JSON.stringify(updated));

    const newChecked = [...checkedItems];
    newChecked[index] = true;
    setCheckedItems(newChecked);
  };

  return (
    <View style={styles.container}>
      <NavHeader
        title="Taking care of"
        subtitle="Mom"
        onHelpPress={() => setHelpVisible(true)}
      />

      {/* Help Modal */}
      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Supplies Page</Text>
            <Text style={styles.helpText}>
              Use this page to track medical or caregiving supplies. Tap the checkbox to mark an item as needed.
            </Text>
            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/supplyDetail')}
      >
        <Text style={styles.addButtonText}>ADD PRODUCT</Text>
      </TouchableOpacity>

      <FlatList
        data={supplies}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.supplyItem}>
            <TouchableOpacity
              style={styles.rowContent}
              onPress={() =>
                router.push({
                  pathname: '/supplyDetail',
                  params: { ...item, index },
                })
              }
            >
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.image} />
              )}
              <View style={styles.textContainer}>
                <View style={styles.rowBetween}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.meta}>Size: {item.size}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.description}>{item.description}</Text>
                  <Text style={styles.meta}>From: {item.source}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => markAsNeeded(item, index)}
                style={styles.checkbox}
              >
                {checkedItems[index] ? (
                  <Ionicons name="checkbox-outline" size={24} color="#1976D2" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#888" />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
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
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  supplyItem: {
    backgroundColor: '#f4f6f8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#ccc',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontWeight: 'bold', fontSize: 17 },
  description: { fontSize: 15, color: '#555', flex: 1 },
  meta: { fontSize: 14, color: '#666', marginLeft: 10 },
  checkbox: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
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






