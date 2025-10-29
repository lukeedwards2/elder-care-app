import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Image, Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function FoodDetail() {
  const { index, title: existingTitle, description: existingDescription, source: existingSource, type: existingType, image: existingImage } = useLocalSearchParams();
  const router = useRouter();

  const [title, setTitle] = useState(existingTitle || '');
  const [description, setDescription] = useState(existingDescription || '');
  const [source, setSource] = useState(existingSource || '');
  const [type, setType] = useState(existingType || '');
  const [image, setImage] = useState(existingImage || '');

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') Alert.alert('Permission required', 'Camera roll access is needed.');
    })();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveFood = async () => {
    if (!title) return Alert.alert('Title is required');

    const stored = await AsyncStorage.getItem('stored_foods');
    const foods = stored ? JSON.parse(stored) : [];

    const updatedItem = { title, description, source, type, image };

    if (index !== undefined) {
      foods[Number(index)] = updatedItem;
    } else {
      foods.push(updatedItem);
    }

    await AsyncStorage.setItem('stored_foods', JSON.stringify(foods));
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Enter title" />

      <Text style={styles.label}>Description</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Enter description" />

      <Text style={styles.label}>Source</Text>
      <TextInput style={styles.input} value={source} onChangeText={setSource} placeholder="Enter source/store" />

      <Text style={styles.label}>Type</Text>
      <TextInput style={styles.input} value={type} onChangeText={setType} placeholder="e.g. Frozen, Fresh" />

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text style={styles.imagePickerText}>Pick an Image</Text>
      </TouchableOpacity>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}

      <TouchableOpacity style={styles.saveButton} onPress={saveFood}>
        <Text style={styles.saveButtonText}>Save Food</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  label: { fontWeight: 'bold', marginTop: 12 },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  imagePicker: {
    backgroundColor: '#388E3C',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 12,
  },
  imagePickerText: { color: '#fff', fontWeight: 'bold' },
  image: { width: 100, height: 100, borderRadius: 10, alignSelf: 'center' },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
