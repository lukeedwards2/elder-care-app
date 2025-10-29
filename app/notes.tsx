import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, Modal, Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import NavHeader from '../components/NavHeader';

export default function NotesScreen() {
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const saved = await AsyncStorage.getItem('stored_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        const sorted = parsed.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setNotes(sorted);
      }
    } catch (e) {
      console.log('Failed to load notes:', e);
    }
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
            <Text style={styles.helpTitle}>Notes Page</Text>
            <Text style={styles.helpText}>
              This page allows you to log and view caregiving notes. Tap a note to see full details, or use the search to filter notes.
            </Text>
            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/addNote')}
      >
        <Text style={styles.addButtonText}>ADD NEW NOTE</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.searchBar}
        placeholder="Search notes..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={notes.filter(
          note =>
            note.title.toLowerCase().includes(search.toLowerCase()) ||
            note.content.toLowerCase().includes(search.toLowerCase())
        )}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.noteContainer}
            onPress={() =>
              router.push({
                pathname: '/noteDetail',
                params: { ...item, index },
              })
            }
          >
            <View style={styles.noteRow}>
              <View style={styles.noteTextContainer}>
                <Text style={styles.noteTitle}>{item.title}</Text>
                <Text style={styles.noteDate}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
                <Text numberOfLines={2}>{item.content}</Text>
              </View>
              {item.image && (
                <Image source={{ uri: item.image }} style={styles.thumbnail} />
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  addButton: {
    backgroundColor: '#888',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  noteContainer: {
    backgroundColor: '#eee',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  noteTextContainer: { flex: 1, paddingRight: 10 },
  noteTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  noteDate: { fontSize: 12, color: '#777', marginBottom: 4 },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    resizeMode: 'cover',
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
    borderRadius: 12,
    padding: 20,
    maxWidth: 350,
    width: '100%',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 16,
    textAlign: 'center',
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



