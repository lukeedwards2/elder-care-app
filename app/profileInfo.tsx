// app/profileInfo.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import NavHeader from '@/components/NavHeader';
import { supabase, getSessionSafe } from '@/lib/supabase';

type ProfileState = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
};

export default function ProfileInfo() {
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileState>({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
  });

  const [originalProfile, setOriginalProfile] =
    useState<ProfileState | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const session = await getSessionSafe();

      if (!session?.user) {
        Alert.alert('Error', 'Your login session could not be found.');
        return;
      }

      const user = session.user;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        Alert.alert('Error loading profile', error.message);
        return;
      }

      let finalProfile = data;

      if (!finalProfile) {
        const payload = {
          id: user.id,
          email: user.email ?? '',
          first_name:
            (user.user_metadata?.first_name as string | undefined) ?? '',
          last_name:
            (user.user_metadata?.last_name as string | undefined) ?? '',
        };

        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          Alert.alert(
            'Error creating profile record',
            insertError.message
          );
          return;
        }

        finalProfile = inserted;
      }

      const loadedProfile: ProfileState = {
        id: finalProfile.id,
        first_name: finalProfile.first_name ?? '',
        last_name: finalProfile.last_name ?? '',
        email: finalProfile.email ?? user.email ?? '',
      };

      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message ?? 'Something went wrong while loading your profile.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    const firstName = profile.first_name.trim();
    const lastName = profile.last_name.trim();
    const email = profile.email.trim().toLowerCase();

    if (!firstName || !lastName || !email) {
      Alert.alert(
        'Missing Information',
        'Please enter your first name, last name, and email.'
      );
      return;
    }

    try {
      setSaving(true);

      const session = await getSessionSafe();

      if (!session?.user) {
        Alert.alert('Error', 'Your login session could not be found.');
        return;
      }

      const userId = session.user.id;

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          email,
        })
        .eq('id', userId);

      if (error) {
        Alert.alert('Error updating profile', error.message);
        return;
      }

      const updatedProfile: ProfileState = {
        ...profile,
        first_name: firstName,
        last_name: lastName,
        email,
      };

      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setEditing(false);

      Alert.alert('Profile Updated', 'Your profile has been saved.');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message ?? 'Something went wrong while saving your profile.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }

    setEditing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Log Out',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();

            if (error) {
              Alert.alert('Logout Error', error.message);
              return;
            }

            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
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
              const session = await getSessionSafe();

              if (!session?.user) {
                Alert.alert('Error', 'No active session found.');
                return;
              }

              const FUNCTION_URL =
                'https://zgxaldtqtvaloulhdmyw.supabase.co/functions/v1/delete-account';

              const response = await fetch(FUNCTION_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

              if (!response.ok) {
                const text = await response.text();

                throw new Error(
                  text || 'Failed to delete account.'
                );
              }

              await supabase.auth.signOut();

              Alert.alert(
                'Account Deleted',
                'Your account has been deleted.'
              );

              router.replace('/login');
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.message ?? 'Something went wrong.'
              );
            }
          },
        },
      ]
    );
  };

  const handleChange = (
    key: keyof ProfileState,
    value: string
  ) => {
    setProfile((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <NavHeader />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>
            Loading profile...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

              <Text style={styles.backText}>Account</Text>
            </TouchableOpacity>

            <Text style={styles.heading}>Profile</Text>

            <Text style={styles.subheading}>
              View and update your account information.
            </Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons
                name="person-outline"
                size={34}
                color="#1976D2"
              />
            </View>

            <Text style={styles.profileName}>
              {profile.first_name || profile.last_name
                ? `${profile.first_name} ${profile.last_name}`.trim()
                : 'CareKeeperHub User'}
            </Text>

            <Text style={styles.profileEmail}>
              {profile.email}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Personal Information
            </Text>

            {editing ? (
              <>
                <Text style={styles.inputLabel}>
                  First Name
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={profile.first_name}
                  onChangeText={(text) =>
                    handleChange('first_name', text)
                  }
                  autoCapitalize="words"
                />

                <Text style={styles.inputLabel}>
                  Last Name
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={profile.last_name}
                  onChangeText={(text) =>
                    handleChange('last_name', text)
                  }
                  autoCapitalize="words"
                />

                <Text style={styles.inputLabel}>
                  Email
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  value={profile.email}
                  onChangeText={(text) =>
                    handleChange('email', text)
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    saving && styles.disabledButton,
                  ]}
                  onPress={updateProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={21}
                        color="#FFFFFF"
                      />

                      <Text style={styles.primaryButtonText}>
                        Save Profile
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancelEdit}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <InfoRow
                  icon="person-outline"
                  label="First Name"
                  value={profile.first_name || 'Not provided'}
                />

                <InfoRow
                  icon="person-outline"
                  label="Last Name"
                  value={profile.last_name || 'Not provided'}
                />

                <InfoRow
                  icon="mail-outline"
                  label="Email"
                  value={profile.email || 'Not provided'}
                />

                <InfoRow
                  icon="key-outline"
                  label="Password"
                  value="••••••••"
                />

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setEditing(true)}
                >
                  <Ionicons
                    name="create-outline"
                    size={20}
                    color="#1976D2"
                  />

                  <Text style={styles.editButtonText}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Account
            </Text>

            <TouchableOpacity
              style={styles.accountButton}
              onPress={handleLogout}
            >
              <View style={styles.accountButtonLeft}>
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color="#C62828"
                />

                <Text style={styles.logoutText}>
                  Log Out
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#9AA4AE"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <View style={styles.accountButtonLeft}>
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color="#C62828"
                />

                <View style={styles.deleteTextContainer}>
                  <Text style={styles.deleteTitle}>
                    Delete Account
                  </Text>

                  <Text style={styles.deleteDescription}>
                    Permanently delete your account and data
                  </Text>
                </View>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#9AA4AE"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.userIdText}>
            User ID: {profile.id}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

type InfoRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

function InfoRow({
  icon,
  label,
  value,
}: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#1976D2"
        />
      </View>

      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  keyboardView: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#66727D',
  },

  headingContainer: {
    paddingTop: 18,
    paddingBottom: 16,
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

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#242A30',
  },

  profileEmail: {
    marginTop: 4,
    fontSize: 14,
    color: '#77828C',
  },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#242A30',
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8EE',
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: '#7A858F',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 16,
    color: '#293038',
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5E6973',
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D6DEE5',
    backgroundColor: '#FAFCFE',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 14,
    fontSize: 16,
    color: '#242A30',
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  cancelButton: {
    alignItems: 'center',
    paddingVertical: 13,
    marginTop: 8,
  },

  cancelButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#66727D',
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7DDF3',
    backgroundColor: '#F5FAFE',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 18,
  },

  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 7,
  },

  accountButton: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8EE',
  },

  accountButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#C62828',
    marginLeft: 12,
  },

  deleteButton: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },

  deleteTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  deleteTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#C62828',
  },

  deleteDescription: {
    fontSize: 12,
    lineHeight: 17,
    color: '#77828C',
    marginTop: 2,
  },

  userIdText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#A0A8B0',
    paddingHorizontal: 15,
    marginTop: 2,
  },
});





