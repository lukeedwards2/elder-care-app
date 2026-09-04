import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import NavHeader from '../../components/NavHeader';
import {
  createNote,
  getNoteById,
  updateNote,
} from '../../lib/notes';

export default function AddNoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ noteId?: string }>();
  const { width } = useWindowDimensions();

  const noteId =
    typeof params.noteId === 'string' ? params.noteId : undefined;

  const isEditing = Boolean(noteId);
  const isTablet = width >= 768;

  const contentWidth = isTablet
    ? Math.min(width * 0.82, 760)
    : width;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteImage, setNoteImage] = useState<string | null>(null);
  const [loadingNote, setLoadingNote] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!noteId) {
      return;
    }

    const loadExistingNote = async () => {
      const existingNote = await getNoteById(noteId);

      if (!existingNote) {
        Alert.alert(
          'Note Not Found',
          'This note could not be loaded.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/notes'),
            },
          ]
        );

        return;
      }

      setTitle(existingNote.title);
      setContent(existingNote.content);
      setNoteImage(existingNote.image);
      setLoadingNote(false);
    };

    loadExistingNote();
  }, [noteId, router]);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setNoteImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert(
        'Image Error',
        'We could not open your photo library.'
      );
    }
  };

  const saveNote = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert(
        'Missing Fields',
        'Please enter both a title and note content.'
      );
      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      if (noteId) {
        const success = await updateNote(noteId, {
          title,
          content,
          image: noteImage,
        });

        if (!success) {
          throw new Error('Note could not be updated.');
        }
      } else {
        await createNote({
          title,
          content,
          image: noteImage,
        });
      }

      router.replace('/(tabs)/notes');
    } catch (error) {
      Alert.alert(
        'Error',
        isEditing
          ? 'Failed to update note.'
          : 'Failed to save note.'
      );

      setSaving(false);
    }
  };

  if (loadingNote) {
    return (
      <View style={styles.screen}>
        <NavHeader />

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <NavHeader />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.form,
              {
                width: contentWidth,
              },
            ]}
          >
            <View style={styles.headingRow}>
              <View>
                <Text style={styles.pageTitle}>
                  {isEditing ? 'Edit Note' : 'New Note'}
                </Text>

                <Text style={styles.pageSubtitle}>
                  {isEditing
                    ? 'Update the information below.'
                    : 'Add information you want to remember.'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => router.replace('/(tabs)/notes')}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Title</Text>

            <TextInput
              placeholder="Enter a title"
              placeholderTextColor="#9A9A9A"
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
            />

            <Text style={styles.fieldLabel}>Note</Text>

            <TextInput
              placeholder="Enter your note"
              placeholderTextColor="#9A9A9A"
              style={[styles.input, styles.multiline]}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            {noteImage && (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: noteImage }}
                  style={styles.previewImage}
                />

                <Pressable
                  style={styles.removeImageButton}
                  onPress={() => setNoteImage(null)}
                >
                  <Text style={styles.removeImageText}>
                    Remove Image
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={styles.imageButton}
              onPress={pickImage}
            >
              <Text style={styles.imageButtonText}>
                {noteImage ? 'Change Image' : '＋ Add Image'}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.saveButton,
                saving && styles.saveButtonDisabled,
              ]}
              onPress={saveNote}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving
                  ? 'Saving...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Save Note'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    paddingVertical: 22,
  },

  form: {
    alignSelf: 'center',
    paddingHorizontal: 18,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },

  pageSubtitle: {
    color: '#777',
    fontSize: 14,
    marginTop: 4,
  },

  cancelText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '600',
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 7,
    marginLeft: 2,
  },

  input: {
    minHeight: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9DCE1',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    marginBottom: 20,
    fontSize: 16,
    color: '#111',
  },

  multiline: {
    minHeight: 150,
  },

  imagePreviewContainer: {
    marginBottom: 14,
  },

  previewImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
    borderRadius: 16,
    marginBottom: 10,
  },

  removeImageButton: {
    alignSelf: 'flex-end',
  },

  removeImageText: {
    color: '#C0392B',
    fontWeight: '600',
    fontSize: 14,
  },

  imageButton: {
    minHeight: 52,
    backgroundColor: '#E9EEF5',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  imageButtonText: {
    fontWeight: '700',
    color: '#315A84',
    fontSize: 16,
  },

  saveButton: {
    minHeight: 54,
    backgroundColor: '#1976D2',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#777',
    fontSize: 16,
  },
});