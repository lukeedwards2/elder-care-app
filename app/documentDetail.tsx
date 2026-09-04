// app/documentDetail.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Linking,
} from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import NavHeader from '../components/NavHeader';

type StoredDocument = {
  title: string;
  description: string;
  uri: string;
  fileName?: string;
  mimeType?: string;
};

const STORAGE_KEY = 'stored_documents';

const getParamString = (
  value: string | string[] | undefined
) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

export default function DocumentDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const mode = getParamString(params.mode);
  const resetKey = getParamString(params.resetKey);

  const isAddMode = mode === 'add';

  const originalIndex = getParamString(params.index);
  const originalTitle = getParamString(params.title);
  const originalDescription = getParamString(params.description);
  const originalUri = getParamString(params.uri);
  const originalFileName = getParamString(params.fileName);
  const originalMimeType = getParamString(params.mimeType);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [editing, setEditing] = useState(false);

  /*
   * Reset this screen every time it receives a new Add request,
   * or populate it with the selected document in View mode.
   */
  useFocusEffect(
    useCallback(() => {
      if (isAddMode) {
        setTitle('');
        setDescription('');
        setFileUri('');
        setFileName('');
        setMimeType('');
        setEditing(true);
      } else {
        setTitle(originalTitle);
        setDescription(originalDescription);
        setFileUri(originalUri);
        setFileName(originalFileName);
        setMimeType(originalMimeType);
        setEditing(false);
      }

      return undefined;
    }, [
      isAddMode,
      resetKey,
      originalTitle,
      originalDescription,
      originalUri,
      originalFileName,
      originalMimeType,
    ])
  );

  const handleCancel = () => {
    router.replace('/(tabs)/documents');
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/pdf', 'image/*'],
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

      setFileUri(selectedFile.uri);
      setFileName(selectedFile.name ?? 'Attached document');
      setMimeType(selectedFile.mimeType ?? '');
    } catch (error) {
      console.log('Failed to select document:', error);

      Alert.alert(
        'Unable to Attach File',
        'The document could not be selected. Please try again.'
      );
    }
  };

  const saveDocument = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      Alert.alert(
        'Document Title Required',
        'Please enter a title for this document.'
      );
      return;
    }

    if (!trimmedDescription) {
      Alert.alert(
        'Description Required',
        'Please enter a short description.'
      );
      return;
    }

    if (!fileUri) {
      Alert.alert(
        'Document Required',
        'Please attach a PDF or image before saving.'
      );
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];

      const documents: StoredDocument[] =
        Array.isArray(parsed) ? parsed : [];

      const updatedDocument: StoredDocument = {
        title: trimmedTitle,
        description: trimmedDescription,
        uri: fileUri,
        fileName: fileName || 'Attached document',
        mimeType,
      };

      if (isAddMode) {
        documents.push(updatedDocument);
      } else {
        const index = Number(originalIndex);

        if (
          Number.isNaN(index) ||
          index < 0 ||
          index >= documents.length
        ) {
          Alert.alert(
            'Unable to Save',
            'This document could not be found.'
          );
          return;
        }

        documents[index] = updatedDocument;
      }

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(documents)
      );

      router.replace('/(tabs)/documents');
    } catch (error) {
      console.log('Failed to save document:', error);

      Alert.alert(
        'Unable to Save',
        'The document could not be saved.'
      );
    }
  };

  const handleOpenFile = async () => {
    if (!fileUri) {
      Alert.alert(
        'No Document Attached',
        'There is no attached file to open.'
      );
      return;
    }

    try {
      const supported = await Linking.canOpenURL(fileUri);

      if (!supported) {
        Alert.alert(
          'Unable to Open Document',
          'This file cannot be opened on this device.'
        );
        return;
      }

      await Linking.openURL(fileUri);
    } catch (error) {
      console.log('Failed to open document:', error);

      Alert.alert(
        'Unable to Open Document',
        'The attached file could not be opened.'
      );
    }
  };

  const deleteDocument = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);

      if (!Array.isArray(parsed)) {
        return;
      }

      const index = Number(originalIndex);

      if (
        Number.isNaN(index) ||
        index < 0 ||
        index >= parsed.length
      ) {
        Alert.alert(
          'Unable to Delete',
          'This document could not be found.'
        );
        return;
      }

      parsed.splice(index, 1);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(parsed)
      );

      router.replace('/(tabs)/documents');
    } catch (error) {
      console.log('Failed to delete document:', error);

      Alert.alert(
        'Unable to Delete',
        'The document could not be deleted.'
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Document?',
      `Are you sure you want to delete "${title}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: deleteDocument,
        },
      ]
    );
  };

  const getDocumentIcon = () => {
    if (
      mimeType.includes('pdf') ||
      fileName.toLowerCase().endsWith('.pdf')
    ) {
      return 'document-text-outline';
    }

    if (mimeType.includes('image')) {
      return 'image-outline';
    }

    return 'document-outline';
  };

  const screenTitle = isAddMode
    ? 'Add Document'
    : editing
    ? 'Edit Document'
    : 'Document Details';

  const screenSubtitle = isAddMode
    ? 'Store an important file for the care team.'
    : editing
    ? 'Update this document and its information.'
    : 'View the saved document information.';

  return (
    <View style={styles.screen}>
      <NavHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {(isAddMode || editing) && (
          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.8}
            onPress={
              isAddMode
                ? handleCancel
                : () => {
                    setTitle(originalTitle);
                    setDescription(originalDescription);
                    setFileUri(originalUri);
                    setFileName(originalFileName);
                    setMimeType(originalMimeType);
                    setEditing(false);
                  }
            }
          >
            <Ionicons
              name="chevron-back"
              size={23}
              color="#1976D2"
            />

            <Text style={styles.cancelText}>
              Cancel
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.pageHeading}>
          <View style={styles.headingIcon}>
            <Ionicons
              name={
                isAddMode
                  ? 'add-circle-outline'
                  : editing
                  ? 'create-outline'
                  : 'document-text-outline'
              }
              size={34}
              color="#1976D2"
            />
          </View>

          <View style={styles.headingText}>
            <Text style={styles.pageTitle}>
              {screenTitle}
            </Text>

            <Text style={styles.pageSubtitle}>
              {screenSubtitle}
            </Text>
          </View>
        </View>

        {editing ? (
          <View style={styles.formCard}>
            <Text style={styles.label}>
              Document title
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Insurance Card"
              placeholderTextColor="#AAB3BE"
              value={title}
              onChangeText={setTitle}
              autoCapitalize="sentences"
            />

            <Text style={styles.label}>
              Description
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
              placeholder="What is this document for?"
              placeholderTextColor="#AAB3BE"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.label}>
              Attached document
            </Text>

            <TouchableOpacity
              style={styles.filePicker}
              activeOpacity={0.82}
              onPress={pickFile}
            >
              <View style={styles.filePickerIcon}>
                <Ionicons
                  name={fileUri ? getDocumentIcon() : 'attach-outline'}
                  size={27}
                  color="#1976D2"
                />
              </View>

              <View style={styles.filePickerText}>
                <Text style={styles.filePickerTitle}>
                  {fileUri
                    ? 'Change Document'
                    : 'Attach Document'}
                </Text>

                <Text
                  style={styles.filePickerSubtitle}
                  numberOfLines={1}
                >
                  {fileUri
                    ? fileName || 'Document attached'
                    : 'PDF or image'}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#AAB3BE"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveButton}
              activeOpacity={0.85}
              onPress={saveDocument}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={23}
                color="#fff"
              />

              <Text style={styles.saveButtonText}>
                {isAddMode
                  ? 'Save Document'
                  : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.detailCard}>
              <View style={styles.detailIcon}>
                <Ionicons
                  name={getDocumentIcon()}
                  size={37}
                  color="#1976D2"
                />
              </View>

              <Text style={styles.documentTitle}>
                {title}
              </Text>

              {!!description && (
                <Text style={styles.documentDescription}>
                  {description}
                </Text>
              )}

              <View style={styles.divider} />

              <View style={styles.attachmentRow}>
                <Ionicons
                  name="attach-outline"
                  size={20}
                  color="#687789"
                />

                <View style={styles.attachmentText}>
                  <Text style={styles.attachmentLabel}>
                    Attached file
                  </Text>

                  <Text
                    style={styles.attachmentName}
                    numberOfLines={1}
                  >
                    {fileName || 'Saved document'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.viewButton}
              activeOpacity={0.85}
              onPress={handleOpenFile}
            >
              <Ionicons
                name="eye-outline"
                size={23}
                color="#fff"
              />

              <Text style={styles.viewButtonText}>
                View Document
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.85}
              onPress={() => setEditing(true)}
            >
              <Ionicons
                name="create-outline"
                size={22}
                color="#1976D2"
              />

              <Text style={styles.editButtonText}>
                Edit Document
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.85}
              onPress={confirmDelete}
            >
              <Ionicons
                name="trash-outline"
                size={21}
                color="#C83A32"
              />

              <Text style={styles.deleteButtonText}>
                Delete Document
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  scrollView: {
    flex: 1,
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 35,
  },

  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 38,
    marginBottom: 12,
  },

  cancelText: {
    marginLeft: 2,
    color: '#1976D2',
    fontSize: 17,
    fontWeight: '700',
  },

  pageHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  headingIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  headingText: {
    flex: 1,
  },

  pageTitle: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '800',
    color: '#17202B',
  },

  pageSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: '#7A8694',
    marginTop: 2,
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E1E6ED',
    padding: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#44515F',
    marginBottom: 7,
    marginLeft: 2,
  },

  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#D8DEE6',
    backgroundColor: '#FBFCFE',
    borderRadius: 16,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#17202B',
    marginBottom: 18,
  },

  descriptionInput: {
    minHeight: 115,
    paddingTop: 14,
  },

  filePicker: {
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#D8DEE6',
    borderRadius: 17,
    backgroundColor: '#FBFCFE',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  filePickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
  },

  filePickerText: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },

  filePickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#263240',
  },

  filePickerSubtitle: {
    fontSize: 13,
    color: '#84909D',
    marginTop: 2,
  },

  saveButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#1976D2',
    shadowOpacity: 0.15,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 7,
  },

  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E1E6ED',
    padding: 20,
    alignItems: 'center',
    marginBottom: 18,
  },

  detailIcon: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },

  documentTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#17202B',
    textAlign: 'center',
  },

  documentDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6F7C8A',
    textAlign: 'center',
    marginTop: 7,
  },

  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#E8ECF1',
    marginVertical: 20,
  },

  attachmentRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },

  attachmentText: {
    flex: 1,
    marginLeft: 10,
  },

  attachmentLabel: {
    fontSize: 12,
    color: '#8994A1',
    fontWeight: '600',
  },

  attachmentName: {
    marginTop: 2,
    fontSize: 14,
    color: '#465361',
    fontWeight: '600',
  },

  viewButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  viewButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 7,
  },

  editButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#EDF5FD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
  },

  editButtonText: {
    color: '#1976D2',
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 7,
  },

  deleteButton: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: '#FDEDEC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButtonText: {
    color: '#C83A32',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 7,
  },
});
