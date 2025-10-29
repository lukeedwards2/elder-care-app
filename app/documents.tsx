import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Modal,
  TextInput, Pressable, Alert, Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUri, setFileUri] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const router = useRouter();
  const STORAGE_KEY = 'stored_documents';

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved) setDocuments(JSON.parse(saved));
  };

  const saveDocuments = async (updated) => {
    setDocuments(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const openModal = () => {
    setTitle('');
    setDescription('');
    setFileUri(null);
    setEditingIndex(null);
    setModalVisible(true);
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['application/pdf', 'image/*'],
    });
    if (!result.canceled) {
      setFileUri(result.assets[0].uri);
    }
  };

  const saveDocument = () => {
    if (!title || !description || !fileUri) {
      Alert.alert('Missing Fields', 'Please complete all fields and attach a document.');
      return;
    }

    const newDoc = { title, description, uri: fileUri };
    const updated =
      editingIndex !== null
        ? documents.map((doc, i) => (i === editingIndex ? newDoc : doc))
        : [...documents, newDoc];

    saveDocuments(updated);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.navHeader}>
        <Image source={require('../assets/profile.jpg')} style={styles.profile} />
        <View style={styles.navTitleGroup}>
          <Text style={styles.navTitle}>Taking care of</Text>
          <Text style={styles.navSubtitle}>Mom</Text>
        </View>
        <TouchableOpacity onPress={() => setHelpVisible(true)}>
          <Image source={require('../assets/light-bulb.png')} style={styles.helpIcon} />
        </TouchableOpacity>
      </View>

      {/* Help Modal */}
      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Documents Page</Text>
            <Text style={styles.helpText}>
              This page allows you to upload and store important documents like prescriptions, discharge papers, or notes from appointments. Tap on a document row to view or edit details.
            </Text>
            <Pressable style={styles.saveButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.addButton} onPress={openModal}>
        <Text style={styles.addButtonText}>ADD DOCUMENT</Text>
      </TouchableOpacity>

      <FlatList
        data={documents}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.documentItem}
            onPress={() =>
              router.push({
                pathname: '/documentDetail',
                params: { ...item, index },
              })
            }
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>
              {editingIndex !== null ? 'Edit Document' : 'New Document'}
            </Text>
            <TextInput
              placeholder="Document Title"
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
            <Pressable style={styles.attachButton} onPress={pickFile}>
              <Text style={styles.attachButtonText}>
                {fileUri ? 'Change File' : 'Attach Document'}
              </Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={saveDocument}>
              <Text style={styles.saveButtonText}>Save Document</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976D2',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  profile: { width: 50, height: 50, borderRadius: 25 },
  navTitleGroup: { alignItems: 'center', flex: 1 },
  navTitle: { color: '#fff', fontSize: 14 },
  navSubtitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  helpIcon: { width: 26, height: 26 },
  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  helpBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    maxWidth: 350,
    width: '100%',
  },
  helpTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#1976D2',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  documentItem: {
    backgroundColor: '#eee',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  description: { fontSize: 14, color: '#555' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  attachButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  attachButtonText: {
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


