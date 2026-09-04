import React, {
  useEffect,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import NavHeader from '../../components/NavHeader';

import {
  CONTACT_GROUPS,
  ContactGroup,
  createContact,
  getContactById,
  updateContact,
} from '../../lib/contacts';

export default function ContactFormScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      contactId?: string;
    }>();

  const { width } = useWindowDimensions();

  const contactId =
    typeof params.contactId === 'string'
      ? params.contactId
      : undefined;

  const isEditing = Boolean(contactId);
  const isTablet = width >= 768;

  const contentWidth = isTablet
    ? Math.min(width * 0.82, 760)
    : width;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  const [group, setGroup] =
    useState<ContactGroup>('Family');

  const [loadingContact, setLoadingContact] =
    useState(isEditing);

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    if (!contactId) {
      return;
    }

    const loadExistingContact = async () => {
      const existingContact =
        await getContactById(contactId);

      if (!existingContact) {
        Alert.alert(
          'Contact Not Found',
          'This contact could not be loaded.',
          [
            {
              text: 'OK',
              onPress: () =>
                router.replace(
                  '/(tabs)/contacts'
                ),
            },
          ]
        );

        return;
      }

      setName(existingContact.name);
      setPhone(existingContact.phone);
      setEmail(existingContact.email);
      setAddress(existingContact.address);
      setGroup(existingContact.group);

      setLoadingContact(false);
    };

    loadExistingContact();
  }, [contactId, router]);

  const saveContact = async () => {
    if (
      !name.trim() ||
      !phone.trim() ||
      !email.trim()
    ) {
      Alert.alert(
        'Missing Fields',
        'Please enter a name, phone number, and email address.'
      );

      return;
    }

    if (saving) {
      return;
    }

    setSaving(true);

    try {
      if (contactId) {
        const success =
          await updateContact(contactId, {
            name,
            phone,
            email,
            address,
            group,
          });

        if (!success) {
          throw new Error(
            'Contact could not be updated.'
          );
        }
      } else {
        await createContact({
          name,
          phone,
          email,
          address,
          group,
        });
      }

      router.replace('/(tabs)/contacts');
    } catch {
      Alert.alert(
        'Error',
        isEditing
          ? 'Failed to update contact.'
          : 'Failed to save contact.'
      );

      setSaving(false);
    }
  };

  if (loadingContact) {
    return (
      <View style={styles.screen}>
        <NavHeader />

        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Loading contact...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <NavHeader />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            styles.scrollContent
          }
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
                  {isEditing
                    ? 'Edit Contact'
                    : 'New Contact'}
                </Text>

                <Text style={styles.pageSubtitle}>
                  {isEditing
                    ? 'Update this contact’s information.'
                    : 'Add someone important to the care team.'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() =>
                  router.replace(
                    '/(tabs)/contacts'
                  )
                }
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>
              Full Name
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter full name"
              placeholderTextColor="#9A9A9A"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>
              Phone Number
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="#9A9A9A"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.fieldLabel}>
              Email Address
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              placeholderTextColor="#9A9A9A"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.fieldLabel}>
              Street Address
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#9A9A9A"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="words"
            />

            <Text style={styles.fieldLabel}>
              Group
            </Text>

            <View style={styles.groupContainer}>
              {CONTACT_GROUPS.map((option) => {
                const selected =
                  group === option;

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.groupOption,
                      selected &&
                        styles.groupOptionSelected,
                    ]}
                    onPress={() =>
                      setGroup(option)
                    }
                  >
                    <Text
                      style={[
                        styles.groupOptionText,
                        selected &&
                          styles.groupOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[
                styles.saveButton,
                saving &&
                  styles.saveButtonDisabled,
              ]}
              disabled={saving}
              onPress={saveContact}
            >
              <Text style={styles.saveButtonText}>
                {saving
                  ? 'Saving...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Save Contact'}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    maxWidth: 285,
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
    color: '#111',
    fontSize: 16,
  },

  groupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 26,
  },

  groupOption: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D6D9DE',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  groupOptionSelected: {
    backgroundColor: '#1976D2',
    borderColor: '#1976D2',
  },

  groupOptionText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },

  groupOptionTextSelected: {
    color: '#FFFFFF',
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
    fontSize: 17,
    fontWeight: '700',
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