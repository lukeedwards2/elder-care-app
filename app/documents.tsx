// app/documents.tsx

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
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

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);

  const router = useRouter();

  const loadDocuments = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setDocuments([]);
        return;
      }

      const parsed = JSON.parse(saved);
      setDocuments(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.log('Failed to load documents:', error);
      setDocuments([]);
    }
  }, []);

  // Reload whenever we return from adding, editing, or deleting.
  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const openAddDocument = () => {
    router.push({
      pathname: '/(tabs)/documentDetail',
      params: {
        mode: 'add',
        resetKey: Date.now().toString(),
      },
    });
  };

  const openDocument = (item: StoredDocument, index: number) => {
    router.push({
      pathname: '/(tabs)/documentDetail',
      params: {
        mode: 'view',
        index: String(index),
        title: item.title,
        description: item.description,
        uri: item.uri,
        fileName: item.fileName ?? '',
        mimeType: item.mimeType ?? '',
      },
    });
  };

  const getFileIcon = (document: StoredDocument) => {
    if (
      document.mimeType?.includes('pdf') ||
      document.fileName?.toLowerCase().endsWith('.pdf')
    ) {
      return 'document-text-outline';
    }

    if (document.mimeType?.includes('image')) {
      return 'image-outline';
    }

    return 'document-outline';
  };

  const renderDocument = ({
    item,
    index,
  }: {
    item: StoredDocument;
    index: number;
  }) => (
    <TouchableOpacity
      style={styles.documentCard}
      activeOpacity={0.82}
      onPress={() => openDocument(item, index)}
    >
      <View style={styles.documentIcon}>
        <Ionicons
          name={getFileIcon(item)}
          size={31}
          color="#1976D2"
        />
      </View>

      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={1}>
          {item.title}
        </Text>

        {!!item.description && (
          <Text style={styles.documentDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.fileRow}>
          <Ionicons
            name="attach-outline"
            size={15}
            color="#718092"
          />

          <Text style={styles.fileText} numberOfLines={1}>
            {item.fileName || 'Attached document'}
          </Text>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={22}
        color="#AAB3BE"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <NavHeader />

      <View style={styles.content}>
        <View style={styles.pageHeading}>
          <View style={styles.headingText}>
            <Text style={styles.pageTitle}>Documents</Text>

            <Text style={styles.pageSubtitle}>
              Keep important records and files easy to find.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.helpButton}
            activeOpacity={0.8}
            onPress={() => setHelpVisible(true)}
          >
            <Text style={styles.helpQuestion}>?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={openAddDocument}
        >
          <Ionicons
            name="add"
            size={26}
            color="#fff"
          />

          <Text style={styles.addButtonText}>
            ADD DOCUMENT
          </Text>
        </TouchableOpacity>

        <FlatList
          data={documents}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderDocument}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            documents.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="documents-outline"
                  size={36}
                  color="#1976D2"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No documents yet
              </Text>

              <Text style={styles.emptyText}>
                Store prescriptions, discharge papers, insurance
                information, appointment notes, and other important files.
              </Text>
            </View>
          }
        />
      </View>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.helpBox}>
            <View style={styles.helpIconCircle}>
              <Ionicons
                name="documents-outline"
                size={30}
                color="#1976D2"
              />
            </View>

            <Text style={styles.helpTitle}>
              Documents
            </Text>

            <Text style={styles.helpText}>
              Keep important caregiving documents in one place.
              Add a title and description, then attach a PDF or image.
              Tap any saved document to view, edit, or delete it.
            </Text>

            <Pressable
              style={styles.gotItButton}
              onPress={() => setHelpVisible(false)}
            >
              <Text style={styles.gotItButtonText}>
                Got it
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },

  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
  },

  pageHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  headingText: {
    flex: 1,
    paddingRight: 12,
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

  helpButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D8DEE6',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  helpQuestion: {
    fontSize: 25,
    color: '#1976D2',
    fontWeight: '700',
  },

  addButton: {
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,

    shadowColor: '#1976D2',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },

    elevation: 3,
  },

  addButtonText: {
    marginLeft: 4,
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  listContent: {
    paddingBottom: 28,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E1E6ED',
    padding: 15,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 2,
  },

  documentIcon: {
    width: 68,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  documentInfo: {
    flex: 1,
    paddingRight: 8,
  },

  documentTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#17202B',
  },

  documentDescription: {
    fontSize: 14,
    lineHeight: 19,
    color: '#717E8D',
    marginTop: 4,
  },

  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  fileText: {
    flex: 1,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#718092',
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#17202B',
  },

  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: '#7A8694',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 32, 0.46)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  helpBox: {
    width: '100%',
    maxWidth: 390,
    borderRadius: 24,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },

  helpIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 21,
    backgroundColor: '#EAF3FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  helpTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#17202B',
    marginBottom: 8,
  },

  helpText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#667383',
    textAlign: 'center',
  },

  gotItButton: {
    width: '100%',
    marginTop: 22,
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gotItButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});


