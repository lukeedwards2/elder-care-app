import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'stored_notes';

export type StoredNote = {
  id: string;
  title: string;
  content: string;
  image: string | null;
  createdAt: string;
  updatedAt?: string;
};

function normalizeNote(note: any, index: number): StoredNote {
  const createdAt =
    typeof note?.createdAt === 'string'
      ? note.createdAt
      : new Date().toISOString();

  return {
    id:
      typeof note?.id === 'string' && note.id.length > 0
        ? note.id
        : `${createdAt}-${index}`,
    title: typeof note?.title === 'string' ? note.title : '',
    content: typeof note?.content === 'string' ? note.content : '',
    image: typeof note?.image === 'string' ? note.image : null,
    createdAt,
    updatedAt:
      typeof note?.updatedAt === 'string' ? note.updatedAt : undefined,
  };
}

export async function loadNotes(): Promise<StoredNote[]> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed.map(normalizeNote);

    // Save the normalized version so older notes receive permanent IDs.
    const neededMigration = parsed.some(
      (note) => !note?.id || typeof note.id !== 'string'
    );

    if (neededMigration) {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(normalized)
      );
    }

    return normalized.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.warn('Failed to load notes:', error);
    return [];
  }
}

export async function getNoteById(
  id: string
): Promise<StoredNote | null> {
  const notes = await loadNotes();
  return notes.find((note) => note.id === id) ?? null;
}

export async function createNote({
  title,
  content,
  image,
}: {
  title: string;
  content: string;
  image: string | null;
}): Promise<StoredNote> {
  const notes = await loadNotes();

  const now = new Date().toISOString();

  const newNote: StoredNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    title: title.trim(),
    content: content.trim(),
    image,
    createdAt: now,
  };

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([...notes, newNote])
  );

  return newNote;
}

export async function updateNote(
  id: string,
  updates: {
    title: string;
    content: string;
    image: string | null;
  }
): Promise<boolean> {
  const notes = await loadNotes();

  let found = false;

  const updatedNotes = notes.map((note) => {
    if (note.id !== id) {
      return note;
    }

    found = true;

    return {
      ...note,
      title: updates.title.trim(),
      content: updates.content.trim(),
      image: updates.image,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!found) {
    return false;
  }

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedNotes)
  );

  return true;
}

export async function deleteNote(id: string): Promise<boolean> {
  const notes = await loadNotes();
  const updatedNotes = notes.filter((note) => note.id !== id);

  if (updatedNotes.length === notes.length) {
    return false;
  }

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedNotes)
  );

  return true;
}