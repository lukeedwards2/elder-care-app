import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavHeader from '../components/NavHeader';

export default function ActionScreen() {
  const [neededItems, setNeededItems] = useState([]);

  useEffect(() => {
    loadNeededItems();
  }, []);

  const loadNeededItems = async () => {
    const stored = await AsyncStorage.getItem('stored_actions');
    if (stored) setNeededItems(JSON.parse(stored));
  };

  const removeItem = async (index) => {
    const updated = [...neededItems];
    updated.splice(index, 1);
    setNeededItems(updated);
    await AsyncStorage.setItem('stored_actions', JSON.stringify(updated));
  };

  const confirmDelete = (index) => {
    Alert.alert(
      'Remove from Action Needed?',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => removeItem(index), style: 'destructive' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <NavHeader
        title="Action Needed"
        subtitle="Supplies"
        onHelpPress={() => Alert.alert('Help', 'This page shows the supplies that need to be replenished.')}
      />

      {neededItems.length === 0 ? (
        <Text style={styles.emptyText}>No action needed at the moment.</Text>
      ) : (
        <FlatList
          data={neededItems}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.itemCard}>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.image} />
              )}
              <View style={styles.infoContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.meta}>Size: {item.size}</Text>
                <Text style={styles.meta}>From: {item.source}</Text>
                <Text style={styles.quantity}>Qty Needed: {item.quantity}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(index)}>
                <Text style={styles.removeText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  emptyText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#777',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 12,
  },
  infoContainer: { flex: 1 },
  title: { fontSize: 17, fontWeight: 'bold', marginBottom: 4 },
  description: { fontSize: 15, marginBottom: 4 },
  meta: { fontSize: 14, color: '#555' },
  quantity: { marginTop: 4, fontWeight: 'bold', color: '#c62828' },
  removeText: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 6,
  },
});
