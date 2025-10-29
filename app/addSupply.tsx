import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Pressable, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function AddSupply() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [size, setSize] = useState('');
  const [source, setSource] = useState('');
  const [image, setImage] = useState(null);
  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveSupply = async () => {
    if (!title || !description || !size || !source || !image) {
      Alert.alert('Missing Fields', 'Please complete all fields and select an image.');
      return;
    }

    const newSupply = { title, description, size, source, image };
    try {
      const stored = await AsyncStorage.getItem('stored_supplies');
      const supplies = stored ? JSON.parse(stored) : [];
      const updated = [...supplies, newSupply];
      await AsyncStorage.setItem('stored_supplies', JSON.stringify(updated));
      router.back();
    } catch (e) {
      console.log('Failed to save supply:', e);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        placeholder="Description"
        style={styles.input}
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        placeholder="Size"
        style={styles.input}
        value={size}
        onChangeText={setSize}
      />
      <TextInput
        placeholder="Purchase Source"
        style={styles.input}
        value={source}
        onChangeText={setSource}
      />
      <Pressable style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>{image ? 'Change Image' : 'Pick Image'}</Text>
      </Pressable>
      <TouchableOpacity style={styles.saveButton} onPress={saveSupply}>
        <Text style={styles.saveButtonText}>Save Supply</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  imageButton: {
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
