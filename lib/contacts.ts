import AsyncStorage from '@react-native-async-storage/async-storage';

const CONTACTS_KEY = 'stored_contacts';

export const CONTACT_GROUPS = [
  'Family',
  'Friends',
  'Doctors',
  'Financial Assistance',
] as const;

export type ContactGroup = (typeof CONTACT_GROUPS)[number];

export type StoredContact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  group: ContactGroup;
  createdAt?: string;
  updatedAt?: string;
};

const groupOrder: Record<ContactGroup, number> = {
  Family: 1,
  Friends: 2,
  Doctors: 3,
  'Financial Assistance': 4,
};

function normalizeGroup(group: unknown): ContactGroup {
  if (
    typeof group === 'string' &&
    CONTACT_GROUPS.includes(group as ContactGroup)
  ) {
    return group as ContactGroup;
  }

  return 'Family';
}

function normalizeContact(
  contact: any,
  index: number
): StoredContact {
  const name =
    typeof contact?.name === 'string' ? contact.name : '';

  return {
    id:
      typeof contact?.id === 'string' && contact.id.length > 0
        ? contact.id
        : `${Date.now()}-${index}-${Math.random()
            .toString(36)
            .slice(2, 8)}`,

    name,
    phone:
      typeof contact?.phone === 'string' ? contact.phone : '',
    email:
      typeof contact?.email === 'string' ? contact.email : '',
    address:
      typeof contact?.address === 'string'
        ? contact.address
        : '',
    group: normalizeGroup(contact?.group),
    createdAt:
      typeof contact?.createdAt === 'string'
        ? contact.createdAt
        : undefined,
    updatedAt:
      typeof contact?.updatedAt === 'string'
        ? contact.updatedAt
        : undefined,
  };
}

function sortContacts(
  contacts: StoredContact[]
): StoredContact[] {
  return [...contacts].sort((a, b) => {
    const groupDifference =
      groupOrder[a.group] - groupOrder[b.group];

    if (groupDifference !== 0) {
      return groupDifference;
    }

    return a.name.localeCompare(b.name, undefined, {
      sensitivity: 'base',
    });
  });
}

async function saveContacts(
  contacts: StoredContact[]
): Promise<void> {
  await AsyncStorage.setItem(
    CONTACTS_KEY,
    JSON.stringify(sortContacts(contacts))
  );
}

export async function loadContacts(): Promise<
  StoredContact[]
> {
  try {
    const saved = await AsyncStorage.getItem(CONTACTS_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed.map(normalizeContact);

    const needsMigration = parsed.some(
      (contact) =>
        !contact?.id || typeof contact.id !== 'string'
    );

    if (needsMigration) {
      await saveContacts(normalized);
    }

    return sortContacts(normalized);
  } catch (error) {
    console.warn('Failed to load contacts:', error);
    return [];
  }
}

export async function getContactById(
  id: string
): Promise<StoredContact | null> {
  const contacts = await loadContacts();

  return (
    contacts.find((contact) => contact.id === id) ?? null
  );
}

export async function createContact({
  name,
  phone,
  email,
  address,
  group,
}: {
  name: string;
  phone: string;
  email: string;
  address: string;
  group: ContactGroup;
}): Promise<StoredContact> {
  const contacts = await loadContacts();

  const newContact: StoredContact = {
    id: `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`,
    name: name.trim(),
    phone: phone.trim(),
    email: email.trim(),
    address: address.trim(),
    group,
    createdAt: new Date().toISOString(),
  };

  await saveContacts([...contacts, newContact]);

  return newContact;
}

export async function updateContact(
  id: string,
  updates: {
    name: string;
    phone: string;
    email: string;
    address: string;
    group: ContactGroup;
  }
): Promise<boolean> {
  const contacts = await loadContacts();

  let found = false;

  const updatedContacts = contacts.map((contact) => {
    if (contact.id !== id) {
      return contact;
    }

    found = true;

    return {
      ...contact,
      name: updates.name.trim(),
      phone: updates.phone.trim(),
      email: updates.email.trim(),
      address: updates.address.trim(),
      group: updates.group,
      updatedAt: new Date().toISOString(),
    };
  });

  if (!found) {
    return false;
  }

  await saveContacts(updatedContacts);

  return true;
}

export async function deleteContact(
  id: string
): Promise<boolean> {
  const contacts = await loadContacts();

  const updatedContacts = contacts.filter(
    (contact) => contact.id !== id
  );

  if (updatedContacts.length === contacts.length) {
    return false;
  }

  await saveContacts(updatedContacts);

  return true;
}