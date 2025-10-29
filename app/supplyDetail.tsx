import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Alert, Image, ScrollView
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

export default function SupplyDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [title, setTitle] = useState(params.title || '');
  const [description, setDescription] = useState(params.description || '');
  const [size, setSize] = useState(params.size || '');
  const [source, setSource] = useState(params.source || '');
  const [image, setImage] = useState(params.image || null);
  const [index, setIndex] = useState(params.index !== undefined ? Number(params.index) : null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Permission to access media library is needed.');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveSupply = async () => {
    if (!title || !description || !size || !source) {
      Alert.alert('Missing fields', 'Please fill out all the fields.');
      return;
    }

    const newSupply = { title, description, size, source, image };
    const stored = await AsyncStorage.getItem('stored_supplies');
    const parsed = stored ? JSON.parse(stored) : [];

    if (index !== null) {
      parsed[index] = newSupply;
    } else {
      parsed.push(newSupply);
    }

    await AsyncStorage.setItem('stored_supplies', JSON.stringify(parsed));
    router.back();
  };

  const handleDelete = async () => {
    const stored = await AsyncStorage.getItem('stored_supplies');
    if (!stored) return;

    const parsed = JSON.parse(stored);
    parsed.splice(index, 1);
    await AsyncStorage.setItem('stored_supplies', JSON.stringify(parsed));
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TextInput
        placeholder="Product Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        placeholder="Description"
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        placeholder="Size"
        style={styles.input}
        value={size}
        onChangeText={setSize}
      />
      <TextInput
        placeholder="Where to Buy From"
        style={styles.input}
        value={source}
        onChangeText={setSource}
      />

      <Pressable style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>{image ? 'Change Image' : 'Add Image'}</Text>
      </Pressable>
      {image && <Image source={{ uri: image }} style={styles.imagePreview} />}

      <Pressable style={styles.saveButton} onPress={saveSupply}>
        <Text style={styles.saveButtonText}>Save Product</Text>
      </Pressable>

      {index !== null && (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Delete Product</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  imageButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  imageButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  imagePreview: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: '#c0392b',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold' },
});
