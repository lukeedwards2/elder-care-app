import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Image, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';

export default function AddNote() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteImage, setNoteImage] = useState(null);

  const router = useRouter();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled) {
      setNoteImage(result.assets[0].uri);
    }
  };

  const saveNote = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('Missing Fields', 'Please enter both a title and note content.');
      return;
    }

    const newNote = {
      title,
      content,
      image: noteImage,
      createdAt: new Date().toISOString(),
    };

    try {
      const saved = await AsyncStorage.getItem('stored_notes');
      const existing = saved ? JSON.parse(saved) : [];
      const updated = [...existing, newNote];
      await AsyncStorage.setItem('stored_notes', JSON.stringify(updated));
      router.replace('/notes');
    } catch (e) {
      Alert.alert('Error', 'Failed to save note.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>New Note</Text>

      <TextInput
        placeholder="Title"
        style={styles.input}
        value={title}
        onChangeText={setTitle}
      />

      <TextInput
        placeholder="Note"
        style={[styles.input, styles.multiline]}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
      />

      <Pressable style={styles.imageButton} onPress={pickImage}>
        <Text style={styles.imageButtonText}>
          {noteImage ? 'Change Image' : 'Add Image'}
        </Text>
      </Pressable>

      {noteImage && (
        <Image source={{ uri: noteImage }} style={styles.previewImage} />
      )}

      <Pressable style={styles.saveButton} onPress={saveNote}>
        <Text style={styles.saveButtonText}>Save Note</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageButton: {
    backgroundColor: '#ccc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  imageButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 16,
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
