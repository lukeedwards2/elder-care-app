import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import NavHeader from '../components/NavHeader';

export default function FoodScreen() {
  const [foods, setFoods] = useState([]);
  const [helpVisible, setHelpVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadFoods();
  }, []);

  const loadFoods = async () => {
    const saved = await AsyncStorage.getItem('stored_foods');
    if (saved) setFoods(JSON.parse(saved));
  };

  const markAsNeeded = async (item) => {
    const current = await AsyncStorage.getItem('stored_actions');
    const parsed = current ? JSON.parse(current) : [];
    const updated = [...parsed, { ...item, quantity: 1 }];
    await AsyncStorage.setItem('stored_actions', JSON.stringify(updated));
    alert(`${item.title} marked as needed.`);
  };

  return (
    <View style={styles.container}>
      <NavHeader
        title="Taking care of"
        subtitle="Mom"
        onHelpPress={() => setHelpVisible(true)}
      />

      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Food Page</Text>
            <Text style={styles.helpText}>
              Track food supplies for your loved one. Add items with descriptions and sources. You can mark items as needed using the checkbox.
            </Text>
            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/foodDetail')}
      >
        <Text style={styles.addButtonText}>ADD FOOD ITEM</Text>
      </TouchableOpacity>

      <FlatList
        data={foods}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.foodItem}>
            <TouchableOpacity
              style={styles.rowContent}
              onPress={() =>
                router.push({
                  pathname: '/foodDetail',
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
                  <Text style={styles.meta}>Type: {item.type}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.description}>{item.description}</Text>
                  <Text style={styles.meta}>From: {item.source}</Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => markAsNeeded(item)}
            >
              <Text style={styles.checkboxText}>☐</Text>
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
    backgroundColor: '#388E3C',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  foodItem: {
    backgroundColor: '#f0f8f5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  rowContent: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  textContainer: { flex: 1, justifyContent: 'center' },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontWeight: 'bold', fontSize: 17 },
  description: { fontSize: 15, color: '#555', flex: 1, flexWrap: 'wrap' },
  meta: { fontSize: 14, color: '#666' },
  checkbox: {
    alignSelf: 'flex-end',
    padding: 4,
    marginRight: 8,
  },
  checkboxText: {
    fontSize: 18,
    color: '#555',
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
    backgroundColor: '#388E3C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
