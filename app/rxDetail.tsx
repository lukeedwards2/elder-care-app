import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Image, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function RxDetail() {
  const router = useRouter();
  const {
    index, name: initName, purpose: initPurpose, frequency: initFrequency,
    strength: initStrength, pharmacy: initPharmacy, notes: initNotes,
    rxNumber: initRxNumber, image: initImage
  } = useLocalSearchParams();

  const [name, setName] = useState(initName || '');
  const [purpose, setPurpose] = useState(initPurpose || '');
  const [frequency, setFrequency] = useState(initFrequency || '');
  const [strength, setStrength] = useState(initStrength || '');
  const [pharmacy, setPharmacy] = useState(initPharmacy || '');
  const [notes, setNotes] = useState(initNotes || '');
  const [rxNumber, setRxNumber] = useState(initRxNumber || '');
  const [image, setImage] = useState(initImage || '');

  const isEditing = index !== undefined;

  const handleSave = async () => {
    const stored = await AsyncStorage.getItem('stored_rx');
    const parsed = stored ? JSON.parse(stored) : [];
    const updatedItem = {
      name, purpose, frequency, strength, pharmacy, notes, rxNumber, image,
    };

    if (isEditing) {
      parsed[Number(index)] = updatedItem;
    } else {
      parsed.push(updatedItem);
    }

    await AsyncStorage.setItem('stored_rx', JSON.stringify(parsed));
    router.back();
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    const stored = await AsyncStorage.getItem('stored_rx');
    if (!stored) return;

    const parsed = JSON.parse(stored);
    parsed.splice(Number(index), 1);
    await AsyncStorage.setItem('stored_rx', JSON.stringify(parsed));
    router.back();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Medication Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text style={styles.label}>Purpose</Text>
      <TextInput value={purpose} onChangeText={setPurpose} style={styles.input} />

      <Text style={styles.label}>Frequency</Text>
      <TextInput value={frequency} onChangeText={setFrequency} style={styles.input} />

      <Text style={styles.label}>Strength</Text>
      <TextInput value={strength} onChangeText={setStrength} style={styles.input} />

      <Text style={styles.label}>Pharmacy</Text>
      <TextInput value={pharmacy} onChangeText={setPharmacy} style={styles.input} />

      <Text style={styles.label}>RX Number</Text>
      <TextInput value={rxNumber} onChangeText={setRxNumber} style={styles.input} />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        multiline
        style={[styles.input, { height: 80 }]}
      />

      <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
        <Text style={styles.imagePickerText}>{image ? 'Change Image' : 'Pick Image'}</Text>
      </TouchableOpacity>

      {image ? <Image source={{ uri: image }} style={styles.previewImage} /> : null}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>{isEditing ? 'Save Changes' : 'Add Medication'}</Text>
      </TouchableOpacity>

      {isEditing && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert('Delete', 'Are you sure you want to delete this?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: handleDelete },
            ])
          }
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
  label: { fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  imagePicker: {
    backgroundColor: '#1976D2',
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 200,
    marginTop: 12,
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: '#388E3C',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#c0392b',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
