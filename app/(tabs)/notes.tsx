import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  useFocusEffect,
  useRouter,
} from 'expo-router';
import NavHeader from '../../components/NavHeader';
import {
  loadNotes,
  StoredNote,
} from '../../lib/notes';

export default function NotesScreen() {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [search, setSearch] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;
  const contentWidth = isTablet
    ? Math.min(width * 0.82, 760)
    : width;

  const refreshNotes = useCallback(async () => {
    setLoading(true);
    const savedNotes = await loadNotes();
    setNotes(savedNotes);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshNotes();
    }, [refreshNotes])
  );

  const filteredNotes = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return notes;
    }

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(term) ||
        note.content.toLowerCase().includes(term)
    );
  }, [notes, search]);

  const renderNote = ({ item }: { item: StoredNote }) => (
    <TouchableOpacity
      style={styles.noteCard}
      activeOpacity={0.78}
      onPress={() =>
        router.push({
          pathname: '/(tabs)/noteDetail',
          params: { noteId: item.id },
        })
      }
    >
      <View style={styles.noteRow}>
        <View style={styles.noteTextContainer}>
          <Text style={styles.noteTitle} numberOfLines={1}>
            {item.title}
          </Text>

          <Text style={styles.noteDate}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>

          <Text style={styles.notePreview} numberOfLines={2}>
            {item.content}
          </Text>
        </View>

        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={styles.thumbnail}
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <NavHeader />

      <View
        style={[
          styles.content,
          {
            width: contentWidth,
          },
        ]}
      >
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNote}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.titleRow}>
                <View>
                  <Text style={styles.pageTitle}>Notes</Text>
                  <Text style={styles.pageSubtitle}>
                    Keep important caregiving information in one place.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.helpButton}
                  onPress={() => setHelpVisible(true)}
                  activeOpacity={0.75}
                >
                  <Image
                    source={require('../../assets/light-bulb.png')}
                    style={styles.helpIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/(tabs)/addNote')}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>＋ Add New Note</Text>
              </TouchableOpacity>

              <TextInput
                style={styles.searchBar}
                placeholder="Search notes..."
                placeholderTextColor="#9A9A9A"
                value={search}
                onChangeText={setSearch}
                clearButtonMode="while-editing"
              />

              {!loading && filteredNotes.length === 0 && (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>
                    {search ? 'No matching notes' : 'No notes yet'}
                  </Text>

                  <Text style={styles.emptyText}>
                    {search
                      ? 'Try searching for something else.'
                      : 'Tap “Add New Note” to create your first note.'}
                  </Text>
                </View>
              )}
            </>
          }
        />
      </View>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>Notes</Text>

            <Text style={styles.helpText}>
              Use Notes to record important caregiving information.
              Search existing notes, tap a note to view its details,
              or create a new note with an optional photo.
            </Text>

            <Pressable
              style={styles.gotItButton}
              onPress={() => setHelpVisible(false)}
            >
              <Text style={styles.gotItButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },

  content: {
    flex: 1,
    alignSelf: 'center',
  },

  listContent: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 28,
  },

  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif',
    }),
  },

  pageSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
    maxWidth: 290,
  },

  helpButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E3E5E8',
  },

  helpIcon: {
    width: 25,
    height: 25,
  },

  addButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  searchBar: {
    height: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9DCE1',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#111',
  },

  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E7E8EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  noteTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  noteTitle: {
    fontWeight: '700',
    fontSize: 17,
    color: '#111',
    marginBottom: 4,
  },

  noteDate: {
    fontSize: 12,
    color: '#858585',
    marginBottom: 7,
  },

  notePreview: {
    fontSize: 15,
    lineHeight: 21,
    color: '#333',
  },

  thumbnail: {
    width: 66,
    height: 66,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    lineHeight: 20,
  },

  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  helpBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    maxWidth: 390,
    width: '100%',
  },

  helpTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },

  helpText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#444',
    marginBottom: 20,
    textAlign: 'center',
  },

  gotItButton: {
    backgroundColor: '#1976D2',
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});