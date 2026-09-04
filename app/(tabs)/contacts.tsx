import React, {
  useCallback,
  useMemo,
  useState,
} from 'react';
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
  Alert,
  Linking,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  useFocusEffect,
  useRouter,
} from 'expo-router';

import NavHeader from '../../components/NavHeader';

import {
  loadContacts,
  StoredContact,
  ContactGroup,
} from '../../lib/contacts';

export default function ContactsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const contentWidth = isTablet
    ? Math.min(width * 0.82, 760)
    : width;

  const [contacts, setContacts] = useState<
    StoredContact[]
  >([]);

  const [search, setSearch] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshContacts = useCallback(async () => {
    setLoading(true);

    const savedContacts = await loadContacts();

    setContacts(savedContacts);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshContacts();
    }, [refreshContacts])
  );

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return contacts;
    }

    return contacts.filter((contact) => {
      return (
        contact.name.toLowerCase().includes(term) ||
        contact.group.toLowerCase().includes(term) ||
        contact.phone.toLowerCase().includes(term) ||
        contact.email.toLowerCase().includes(term)
      );
    });
  }, [contacts, search]);

  const handleCall = async (phone: string) => {
    if (!phone) return;

    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert(
        'Unable to Call',
        'This device could not open the phone app.'
      );
    }
  };

  const handleEmail = async (email: string) => {
    if (!email) return;

    try {
      await Linking.openURL(`mailto:${email}`);
    } catch {
      Alert.alert(
        'Unable to Email',
        'This device could not open an email app.'
      );
    }
  };

  const handleDirections = (address: string) => {
    if (!address.trim()) {
      Alert.alert(
        'No Address',
        'No street address has been saved for this contact.'
      );
      return;
    }

    const encodedAddress =
      encodeURIComponent(address);

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

  const getGroupColors = (
    group: ContactGroup
  ): {
    background: string;
    text: string;
  } => {
    switch (group) {
      case 'Family':
        return {
          background: '#E5F2FC',
          text: '#286A9D',
        };

      case 'Friends':
        return {
          background: '#E5F7E9',
          text: '#387847',
        };

      case 'Doctors':
        return {
          background: '#F0E9FA',
          text: '#6D4A99',
        };

      case 'Financial Assistance':
        return {
          background: '#FFF4D8',
          text: '#8B6B1F',
        };
    }
  };

  const renderContact = ({
    item,
  }: {
    item: StoredContact;
  }) => {
    const colors = getGroupColors(item.group);

    return (
      <TouchableOpacity
        style={styles.contactCard}
        activeOpacity={0.78}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/contactDetail',
            params: {
              contactId: item.id,
            },
          })
        }
      >
        <View style={styles.contactCardTop}>
          <View style={styles.contactInfo}>
            <Text
              style={styles.contactName}
              numberOfLines={1}
            >
              {item.name}
            </Text>

            <View
              style={[
                styles.groupBadge,
                {
                  backgroundColor: colors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.groupBadgeText,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {item.group}
              </Text>
            </View>
          </View>

          <Text style={styles.chevron}>›</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              handleCall(item.phone);
            }}
          >
            <Image
              source={require('../../assets/phone.png')}
              style={styles.actionIcon}
              resizeMode="contain"
            />

            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              handleEmail(item.email);
            }}
          >
            <Image
              source={require('../../assets/email.png')}
              style={styles.actionIcon}
              resizeMode="contain"
            />

            <Text style={styles.actionText}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={(event) => {
              event.stopPropagation();
              handleDirections(item.address);
            }}
          >
            <Image
              source={require('../../assets/home.png')}
              style={styles.actionIcon}
              resizeMode="contain"
            />

            <Text style={styles.actionText}>
              Directions
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContact}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={styles.titleRow}>
                <View style={styles.titleTextContainer}>
                  <Text style={styles.pageTitle}>
                    Contacts
                  </Text>

                  <Text style={styles.pageSubtitle}>
                    Keep important people and care contacts
                    organized.
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.helpButton}
                  onPress={() =>
                    setHelpVisible(true)
                  }
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
                activeOpacity={0.8}
                onPress={() =>
                  router.push(
                    '/(tabs)/contactForm'
                  )
                }
              >
                <Text style={styles.addButtonText}>
                  ＋ Add Contact
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.searchBar}
                placeholder="Search contacts..."
                placeholderTextColor="#9A9A9A"
                value={search}
                onChangeText={setSearch}
                clearButtonMode="while-editing"
              />

              {!loading &&
                filteredContacts.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>
                      {search
                        ? 'No matching contacts'
                        : 'No contacts yet'}
                    </Text>

                    <Text style={styles.emptyText}>
                      {search
                        ? 'Try searching for another name or group.'
                        : 'Tap “Add Contact” to add someone important.'}
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
        onRequestClose={() =>
          setHelpVisible(false)
        }
      >
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>
              Contacts
            </Text>

            <Text style={styles.helpText}>
              Store important family members, friends,
              doctors, and financial contacts here. You
              can quickly call, email, or get directions,
              and tap any contact to view or edit their
              complete information.
            </Text>

            <Pressable
              style={styles.gotItButton}
              onPress={() =>
                setHelpVisible(false)
              }
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  titleTextContainer: {
    flex: 1,
    paddingRight: 12,
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
    color: '#111',
    marginBottom: 16,
  },

  contactCard: {
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

  contactCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contactInfo: {
    flex: 1,
  },

  contactName: {
    color: '#111',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  groupBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },

  groupBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  chevron: {
    color: '#A0A0A0',
    fontSize: 32,
    fontWeight: '300',
    marginLeft: 10,
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#ECEDEF',
    paddingTop: 14,
  },

  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionIcon: {
    width: 22,
    height: 22,
    marginBottom: 4,
  },

  actionText: {
    fontSize: 12,
    color: '#5C6670',
    fontWeight: '600',
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
    lineHeight: 20,
    color: '#777',
    textAlign: 'center',
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
    minHeight: 48,
    backgroundColor: '#1976D2',
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