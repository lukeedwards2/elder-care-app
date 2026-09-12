// app/team-members.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import NavHeader from '@/components/NavHeader';
import { supabase, getSessionSafe } from '@/lib/supabase';

type TeamMember = {
  id: string;
  owner_id: string;
  member_user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string | null;
  created_at?: string | null;
};

type SearchProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
};

const MAX_TEAM_MEMBERS = 10;

export default function TeamMembers() {
  const router = useRouter();

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchProfile | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const session = await getSessionSafe();

      if (!session?.user) {
        Alert.alert(
          'Not Logged In',
          'Please log in to manage your team members.'
        );
        setTeamMembers([]);
        return;
      }

      const { data, error } = await supabase
        .from('team_members')
        .select(
          `
          id,
          owner_id,
          member_user_id,
          first_name,
          last_name,
          email,
          role,
          created_at
          `
        )
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: true });

      if (error) {
        Alert.alert('Error Loading Team', error.message);
        return;
      }

      setTeamMembers((data as TeamMember[]) ?? []);
    } catch (error: any) {
      console.error('fetchTeamMembers error:', error);

      Alert.alert(
        'Error',
        error?.message ?? 'Something went wrong loading your team.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTeamMembers();
  };

  const resetSearch = () => {
    setSearchEmail('');
    setSearchResult(null);
    setSearching(false);
    setAdding(false);
  };

  const openAddMember = () => {
    if (teamMembers.length >= MAX_TEAM_MEMBERS) {
      Alert.alert(
        'Team Limit Reached',
        `You can add up to ${MAX_TEAM_MEMBERS} team members.`
      );
      return;
    }

    resetSearch();
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetSearch();
  };

  const searchForUser = async () => {
    const normalizedEmail = searchEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert(
        'Enter an Email',
        'Enter the email address of the CareKeeperHub user you want to add.'
      );
      return;
    }

    if (!normalizedEmail.includes('@')) {
      Alert.alert(
        'Invalid Email',
        'Please enter a valid email address.'
      );
      return;
    }

    try {
      setSearching(true);
      setSearchResult(null);

      const session = await getSessionSafe();

      if (!session?.user) {
        Alert.alert('Error', 'Your login session could not be found.');
        return;
      }

      const { data, error } = await supabase.rpc(
        'find_profile_by_email',
        {
          search_email: normalizedEmail,
        }
      );

      if (error) {
        Alert.alert('Search Error', error.message);
        return;
      }

      const profiles = (data ?? []) as SearchProfile[];
      const foundProfile = profiles[0];

      if (!foundProfile) {
        Alert.alert(
          'User Not Found',
          'No CareKeeperHub account was found with that email address.'
        );
        return;
      }

      if (foundProfile.id === session.user.id) {
        Alert.alert(
          'That Is Your Account',
          'You cannot add yourself as a team member.'
        );
        return;
      }

      const alreadyAdded = teamMembers.some(
        (member) => member.member_user_id === foundProfile.id
      );

      if (alreadyAdded) {
        Alert.alert(
          'Already Added',
          'This person is already on your team.'
        );
        return;
      }

      setSearchResult(foundProfile);
    } catch (error: any) {
      console.error('searchForUser error:', error);

      Alert.alert(
        'Search Error',
        error?.message ?? 'Something went wrong while searching.'
      );
    } finally {
      setSearching(false);
    }
  };

  const addTeamMember = async () => {
    if (!searchResult) {
      return;
    }

    if (teamMembers.length >= MAX_TEAM_MEMBERS) {
      Alert.alert(
        'Team Limit Reached',
        `You can add up to ${MAX_TEAM_MEMBERS} team members.`
      );
      return;
    }

    try {
      setAdding(true);

      const session = await getSessionSafe();

      if (!session?.user) {
        Alert.alert('Error', 'Your login session could not be found.');
        return;
      }

      const payload = {
        owner_id: session.user.id,
        member_user_id: searchResult.id,
        first_name: searchResult.first_name,
        last_name: searchResult.last_name,
        email: searchResult.email,
        role: 'team_member',
      };

      const { error } = await supabase
        .from('team_members')
        .insert(payload);

      if (error) {
        if (error.code === '23505') {
          Alert.alert(
            'Already Added',
            'This person is already on your team.'
          );
          return;
        }

        Alert.alert('Unable to Add Team Member', error.message);
        return;
      }

      closeModal();
      await fetchTeamMembers();

      Alert.alert(
        'Team Member Added',
        `${getProfileName(searchResult)} has been added to your team.`
      );
    } catch (error: any) {
      console.error('addTeamMember error:', error);

      Alert.alert(
        'Error',
        error?.message ?? 'Something went wrong adding this team member.'
      );
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = (member: TeamMember) => {
    Alert.alert(
      'Remove Team Member',
      `Remove ${getMemberName(member)} from your team?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const session = await getSessionSafe();

              if (!session?.user) {
                Alert.alert('Error', 'Your login session could not be found.');
                return;
              }

              const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', member.id)
                .eq('owner_id', session.user.id);

              if (error) {
                Alert.alert(
                  'Unable to Remove Team Member',
                  error.message
                );
                return;
              }

              await fetchTeamMembers();
            } catch (error: any) {
              console.error('handleDelete error:', error);

              Alert.alert(
                'Error',
                error?.message ?? 'Something went wrong removing this member.'
              );
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }: { item: TeamMember }) => (
    <View style={styles.memberCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {getMemberInitials(item)}
        </Text>
      </View>

      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>
          {getMemberName(item)}
        </Text>

        <Text style={styles.memberEmail}>
          {item.email || 'No email available'}
        </Text>

        <View style={styles.roleBadge}>
          <Ionicons
            name="people-outline"
            size={13}
            color="#1976D2"
          />

          <Text style={styles.roleText}>
            Team Member
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleDelete(item)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color="#C62828"
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <NavHeader />

      <View style={styles.page}>
        <View style={styles.headingContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/profile')}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#1976D2"
            />

            <Text style={styles.backText}>
              Account
            </Text>
          </TouchableOpacity>

          <Text style={styles.heading}>
            Team Members
          </Text>

          <Text style={styles.subheading}>
            Add other CareKeeperHub users who help care for your loved one.
          </Text>
        </View>

        <View style={styles.teamSummary}>
          <View>
            <Text style={styles.summaryTitle}>
              Your Care Team
            </Text>

            <Text style={styles.summaryText}>
              {teamMembers.length} of {MAX_TEAM_MEMBERS} members added
            </Text>
          </View>

          <View style={styles.summaryIcon}>
            <Ionicons
              name="people-outline"
              size={26}
              color="#1976D2"
            />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#1976D2"
            />

            <Text style={styles.loadingText}>
              Loading your team...
            </Text>
          </View>
        ) : (
          <FlatList
            data={teamMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderMember}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              teamMembers.length === 0 &&
                styles.emptyListContent,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#1976D2"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="people-outline"
                    size={38}
                    color="#1976D2"
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  No team members yet
                </Text>

                <Text style={styles.emptyDescription}>
                  Add someone using the email address connected to their
                  CareKeeperHub account.
                </Text>
              </View>
            }
          />
        )}

        <TouchableOpacity
          style={[
            styles.addButton,
            teamMembers.length >= MAX_TEAM_MEMBERS &&
              styles.disabledAddButton,
          ]}
          onPress={openAddMember}
          activeOpacity={0.8}
        >
          <Ionicons
            name="person-add-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.addButtonText}>
            Add Team Member
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={
            Platform.OS === 'ios'
              ? 'padding'
              : undefined
          }
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  Add Team Member
                </Text>

                <Text style={styles.modalSubtitle}>
                  Search by CareKeeperHub account email
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Ionicons
                  name="close"
                  size={23}
                  color="#5F6A74"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>
              Email Address
            </Text>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="name@example.com"
                placeholderTextColor="#9AA4AE"
                value={searchEmail}
                onChangeText={(text) => {
                  setSearchEmail(text);
                  setSearchResult(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="search"
                onSubmitEditing={searchForUser}
              />

              <TouchableOpacity
                style={styles.searchButton}
                onPress={searchForUser}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator
                    size="small"
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="search"
                    size={21}
                    color="#FFFFFF"
                  />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.searchHelp}>
              The person must already have a CareKeeperHub account.
            </Text>

            {searchResult && (
              <View style={styles.resultCard}>
                <View style={styles.resultAvatar}>
                  <Text style={styles.resultAvatarText}>
                    {getProfileInitials(searchResult)}
                  </Text>
                </View>

                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>
                    {getProfileName(searchResult)}
                  </Text>

                  <Text style={styles.resultEmail}>
                    {searchResult.email}
                  </Text>
                </View>

                <Ionicons
                  name="checkmark-circle"
                  size={25}
                  color="#2E7D32"
                />
              </View>
            )}

            {searchResult && (
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  adding && styles.disabledButton,
                ]}
                onPress={addTeamMember}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="person-add-outline"
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text style={styles.confirmButtonText}>
                      Add to Team
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeModal}
              disabled={adding}
            >
              <Text style={styles.cancelButtonText}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function getMemberName(member: TeamMember) {
  const name = [
    member.first_name,
    member.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || member.email || 'Team Member';
}

function getMemberInitials(member: TeamMember) {
  const first = member.first_name?.trim()?.[0] ?? '';
  const last = member.last_name?.trim()?.[0] ?? '';

  const initials = `${first}${last}`.toUpperCase();

  return initials || 'TM';
}

function getProfileName(profile: SearchProfile) {
  const name = [
    profile.first_name,
    profile.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return name || profile.email;
}

function getProfileInitials(profile: SearchProfile) {
  const first = profile.first_name?.trim()?.[0] ?? '';
  const last = profile.last_name?.trim()?.[0] ?? '';

  const initials = `${first}${last}`.toUpperCase();

  return initials || 'TM';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  page: {
    flex: 1,
    paddingHorizontal: 18,
  },

  headingContainer: {
    paddingTop: 18,
    paddingBottom: 14,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1976D2',
    marginLeft: 2,
  },

  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#20252B',
    marginBottom: 5,
  },

  subheading: {
    fontSize: 15,
    lineHeight: 21,
    color: '#66727D',
  },

  teamSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#242A30',
  },

  summaryText: {
    fontSize: 13,
    color: '#77828C',
    marginTop: 3,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#77828C',
  },

  listContent: {
    paddingBottom: 100,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 60,
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: '#242A30',
    marginBottom: 6,
  },

  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#77828C',
    textAlign: 'center',
  },

  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  avatarText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1976D2',
  },

  memberInfo: {
    flex: 1,
    paddingRight: 8,
  },

  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#242A30',
  },

  memberEmail: {
    fontSize: 13,
    color: '#77828C',
    marginTop: 2,
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EDF5FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 7,
  },

  roleText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
    marginLeft: 4,
  },

  removeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButton: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 14,
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: '#1976D2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },

  disabledAddButton: {
    opacity: 0.5,
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '600',
    color: '#242A30',
  },

  modalSubtitle: {
    fontSize: 13,
    color: '#77828C',
    marginTop: 3,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5E6973',
    marginBottom: 7,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  searchInput: {
    flex: 1,
    minHeight: 50,
    backgroundColor: '#FAFCFE',
    borderWidth: 1,
    borderColor: '#D6DEE5',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#242A30',
  },

  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  searchHelp: {
    fontSize: 12,
    lineHeight: 17,
    color: '#89939C',
    marginTop: 8,
  },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6FAFD',
    borderWidth: 1,
    borderColor: '#D9E9F8',
    borderRadius: 14,
    padding: 13,
    marginTop: 18,
  },

  resultAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5F1FC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  resultAvatarText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1976D2',
  },

  resultInfo: {
    flex: 1,
  },

  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#242A30',
  },

  resultEmail: {
    fontSize: 12,
    color: '#77828C',
    marginTop: 2,
  },

  confirmButton: {
    minHeight: 50,
    backgroundColor: '#1976D2',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 7,
  },

  disabledButton: {
    opacity: 0.6,
  },

  cancelButton: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#66727D',
  },
});

