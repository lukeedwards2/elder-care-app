import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NoteDetail() {
  const router = useRouter();
  const { title, content, image, createdAt, index } = useLocalSearchParams();

  const [imagePreviewVisible, setImagePreviewVisible] = React.useState(false);

  const handleDelete = async () => {
    try {
      const saved = await AsyncStorage.getItem('stored_notes');
      if (!saved) return;
      const parsed = JSON.parse(saved);
      parsed.splice(Number(index), 1);
      await AsyncStorage.setItem('stored_notes', JSON.stringify(parsed));
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete note.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.date}>{new Date(createdAt).toLocaleString()}</Text>
      <Text style={styles.content}>{content}</Text>

      {image && (
        <TouchableOpacity onPress={() => setImagePreviewVisible(true)}>
          <Image source={{ uri: image }} style={styles.image} />
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.editButton}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete Note</Text>
      </TouchableOpacity>

      {/* Fullscreen image modal */}
      <Modal visible={imagePreviewVisible} transparent>
        <Pressable
          style={styles.fullscreenContainer}
          onPress={() => setImagePreviewVisible(false)}
        >
          <Image source={{ uri: image }} style={styles.fullscreenImage} />
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  date: { fontSize: 12, color: '#666', marginBottom: 16 },
  content: { fontSize: 16, marginBottom: 20 },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  editButton: {
    backgroundColor: '#555',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  editText: { color: '#fff', fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: '#c0392b',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: 'bold' },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
    borderRadius: 12,
  },
});
