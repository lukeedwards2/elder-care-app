import React, {
  useCallback,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
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
  deleteContact,
  getContactById,
  StoredContact,
} from '../../lib/contacts';

export default function ContactDetailScreen() {
  const router = useRouter();

  const params =
    useLocalSearchParams<{
      contactId?: string;
    }>();

  const { width } = useWindowDimensions();

  const contactId =
    typeof params.contactId === 'string'
      ? params.contactId
      : '';

  const isTablet = width >= 768;

  const contentWidth = isTablet
    ? Math.min(width * 0.82, 760)
    : width;

  const [contact, setContact] =
    useState<StoredContact | null>(null);

  const [loading, setLoading] =
    useState(true);

  const loadContact = useCallback(async () => {
    if (!contactId) {
      setContact(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const storedContact =
      await getContactById(contactId);

    setContact(storedContact);
    setLoading(false);
  }, [contactId]);

  useFocusEffect(
    useCallback(() => {
      loadContact();
    }, [loadContact])
  );

  const handleCall = async () => {
    if (!contact?.phone) return;

    try {
      await Linking.openURL(
        `tel:${contact.phone}`
      );
    } catch {
      Alert.alert(
        'Unable to Call',
        'This device could not open the phone app.'
      );
    }
  };

  const handleEmail = async () => {
    if (!contact?.email) return;

    try {
      await Linking.openURL(
        `mailto:${contact.email}`
      );
    } catch {
      Alert.alert(
        'Unable to Email',
        'This device could not open an email app.'
      );
    }
  };

  const handleDirections = () => {
    if (!contact?.address.trim()) {
      Alert.alert(
        'No Address',
        'No street address has been saved for this contact.'
      );

      return;
    }

    const encodedAddress =
      encodeURIComponent(contact.address);

    Alert.alert(
      'Get Directions',
      'Choose a map service.',
      [
        {
          text: 'Apple Maps',
          onPress: () =>
            Linking.openURL(
              `http://maps.apple.com/?daddr=${encodedAddress}`
            ),
        },
        {
          text: 'Google Maps',
          onPress: () =>
            Linking.openURL(
              `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`
            ),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleEdit = () => {
    if (!contact) return;

    router.push({
      pathname: '/(tabs)/contactForm',
      params: {
        contactId: contact.id,
      },
    });
  };

  const handleDelete = () => {
    if (!contact) return;

    Alert.alert(
      'Delete Contact?',
      `${contact.name} will be permanently removed from your contacts.`,
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
              const success =
                await deleteContact(
                  contact.id
                );

              if (!success) {
                throw new Error(
                  'Contact not found.'
                );
              }

              router.replace(
                '/(tabs)/contacts'
              );
            } catch {
              Alert.alert(
                'Error',
                'Failed to delete contact.'
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <NavHeader />

        <View style={styles.centerState}>
          <Text style={styles.stateText}>
            Loading contact...
          </Text>
        </View>
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.screen}>
        <NavHeader />

        <View style={styles.centerState}>
          <Text style={styles.notFoundTitle}>
            Contact not found
          </Text>

          <Text style={styles.stateText}>
            This contact may have been deleted.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace(
                '/(tabs)/contacts'
              )
            }
          >
            <Text style={styles.backButtonText}>
              Back to Contacts
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
        contentContainerStyle={
          styles.scrollContent
        }
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
            style={styles.contactsBackButton}
            onPress={() =>
              router.replace(
                '/(tabs)/contacts'
              )
            }
          >
            <Text style={styles.contactsBackText}>
              ‹ Contacts
            </Text>
          </TouchableOpacity>

          <View style={styles.contactCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {contact.name
                  .trim()
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <Text style={styles.name}>
              {contact.name}
            </Text>

            <View style={styles.groupBadge}>
              <Text style={styles.groupText}>
                {contact.group}
              </Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.infoRow}
              onPress={handleCall}
            >
              <View style={styles.infoIconContainer}>
                <Image
                  source={require('../../assets/phone.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>
                  Phone
                </Text>

                <Text style={styles.infoValue}>
                  {contact.phone}
                </Text>
              </View>

              <Text style={styles.rowChevron}>
                ›
              </Text>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              style={styles.infoRow}
              onPress={handleEmail}
            >
              <View style={styles.infoIconContainer}>
                <Image
                  source={require('../../assets/email.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>
                  Email
                </Text>

                <Text
                  style={styles.infoValue}
                  numberOfLines={2}
                >
                  {contact.email}
                </Text>
              </View>

              <Text style={styles.rowChevron}>
                ›
              </Text>
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <TouchableOpacity
              style={styles.infoRow}
              onPress={handleDirections}
            >
              <View style={styles.infoIconContainer}>
                <Image
                  source={require('../../assets/home.png')}
                  style={styles.infoIcon}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>
                  Address
                </Text>

                <Text
                  style={[
                    styles.infoValue,
                    !contact.address &&
                      styles.missingValue,
                  ]}
                  numberOfLines={3}
                >
                  {contact.address ||
                    'No address added'}
                </Text>
              </View>

              <Text style={styles.rowChevron}>
                ›
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEdit}
            activeOpacity={0.8}
          >
            <Text style={styles.editText}>
              Edit Contact
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteText}>
              Delete Contact
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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

  contactsBackButton: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingRight: 20,
    marginBottom: 10,
  },

  contactsBackText: {
    color: '#1976D2',
    fontSize: 17,
    fontWeight: '600',
  },

  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7E8EB',
    marginBottom: 16,
    alignItems: 'center',
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#E5F2FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  avatarText: {
    color: '#1976D2',
    fontWeight: '700',
    fontSize: 31,
  },

  name: {
    color: '#111',
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
  },

  groupBadge: {
    marginTop: 8,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E9EEF5',
  },

  groupText: {
    color: '#55708C',
    fontSize: 13,
    fontWeight: '700',
  },

  divider: {
    height: 1,
    backgroundColor: '#ECEDEF',
    width: '100%',
    marginVertical: 20,
  },

  infoRow: {
    width: '100%',
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
  },

  infoIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoIcon: {
    width: 21,
    height: 21,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 3,
  },

  infoValue: {
    color: '#222',
    fontSize: 16,
  },

  missingValue: {
    color: '#999',
    fontStyle: 'italic',
  },

  rowChevron: {
    color: '#AAA',
    fontSize: 28,
    marginLeft: 8,
  },

  rowDivider: {
    height: 1,
    backgroundColor: '#F0F1F3',
    width: '100%',
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
    fontSize: 16,
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '700',
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