import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import NavHeader from '../../components/NavHeader';
import {
  deleteNote,
  getNoteById,
  StoredNote,
} from '../../lib/notes';

export default function NoteDetailScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{ noteId?: string }>();

  const noteId =
    typeof params.noteId === 'string' ? params.noteId : '';

  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const contentWidth = isTablet
    ? Math.min(width * 0.82, 760)
    : width;

  const [note, setNote] = useState<StoredNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagePreviewVisible, setImagePreviewVisible] =
    useState(false);

  const loadNote = useCallback(async () => {
    if (!noteId) {
      setNote(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const storedNote = await getNoteById(noteId);

    setNote(storedNote);
    setLoading(false);
  }, [noteId]);

  useFocusEffect(
    useCallback(() => {
      loadNote();
    }, [loadNote])
  );

  const handleDelete = () => {
    if (!note) {
      return;
    }

    Alert.alert(
      'Delete Note?',
      'This note will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteNote(note.id);

              if (!success) {
                throw new Error('Note not found.');
              }

              router.replace('/(tabs)/notes');
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete note.'
              );
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    if (!note) {
      return;
    }

    router.push({
      pathname: '/(tabs)/addNote',
      params: {
        noteId: note.id,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <NavHeader />

        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading note...
          </Text>
        </View>
      </View>
    );
  }

  if (!note) {
    return (
      <View style={styles.screen}>
        <NavHeader />

        <View style={styles.centerState}>
          <Text style={styles.notFoundTitle}>
            Note not found
          </Text>

          <Text style={styles.stateText}>
            This note may have been deleted.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/notes')}
          >
            <Text style={styles.backButtonText}>
              Back to Notes
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <NavHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.content,
            {
              width: contentWidth,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.notesBackButton}
            onPress={() => router.replace('/(tabs)/notes')}
            activeOpacity={0.7}
          >
            <Text style={styles.notesBackText}>
              ‹ Notes
            </Text>
          </TouchableOpacity>

          <View style={styles.noteCard}>
            <Text style={styles.title}>{note.title}</Text>

            <Text style={styles.date}>
              {new Date(note.createdAt).toLocaleString()}
            </Text>

            {note.updatedAt && (
              <Text style={styles.updatedText}>
                Edited {new Date(note.updatedAt).toLocaleString()}
              </Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.noteContent}>
              {note.content}
            </Text>

            {note.image && (
              <TouchableOpacity
                onPress={() => setImagePreviewVisible(true)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: note.image }}
                  style={styles.image}
                />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <Text style={styles.editText}>
              Edit Note
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteText}>
              Delete Note
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={imagePreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImagePreviewVisible(false)}
      >
        <Pressable
          style={styles.fullscreenContainer}
          onPress={() => setImagePreviewVisible(false)}
        >
          {note.image && (
            <Image
              source={{ uri: note.image }}
              style={styles.fullscreenImage}
            />
          )}

          <Text style={styles.closePreviewText}>
            Tap anywhere to close
          </Text>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  scrollContent: {
    paddingVertical: 20,
  },

  content: {
    alignSelf: 'center',
    paddingHorizontal: 18,
  },

  notesBackButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingRight: 20,
    marginBottom: 10,
  },

  notesBackText: {
    color: '#1976D2',
    fontSize: 17,
    fontWeight: '600',
  },

  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7E8EB',
    marginBottom: 16,
  },

  title: {
    fontSize: 26,
    lineHeight: 33,
    fontWeight: '700',
    color: '#111',
    marginBottom: 7,
  },

  date: {
    fontSize: 13,
    color: '#777',
  },

  updatedText: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },

  divider: {
    height: 1,
    backgroundColor: '#ECEDEF',
    marginVertical: 18,
  },

  noteContent: {
    fontSize: 17,
    lineHeight: 25,
    color: '#222',
  },

  image: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginTop: 20,
    resizeMode: 'cover',
  },

  editButton: {
    minHeight: 54,
    backgroundColor: '#1976D2',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  editText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  deleteButton: {
    minHeight: 54,
    backgroundColor: '#C93A2D',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },

  deleteText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },

  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  fullscreenImage: {
    width: '100%',
    height: '75%',
    resizeMode: 'contain',
  },

  closePreviewText: {
    color: '#FFFFFF',
    marginTop: 16,
    opacity: 0.8,
  },

  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  notFoundTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },

  stateText: {
    color: '#777',
    fontSize: 15,
    textAlign: 'center',
  },

  backButton: {
    marginTop: 20,
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});