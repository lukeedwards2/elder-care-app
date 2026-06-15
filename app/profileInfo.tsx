// profileInfo.tsx
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import NavHeader from '../components/NavHeader';
import { supabase, getSessionSafe } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function ProfileInfo() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '••••••••',
  });

  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const session = await getSessionSafe();
    if (!session || !session.user) {
      Alert.alert('Error fetching user', 'Auth session missing!');
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

    // If no row exists yet, create one automatically
    if (!finalProfile) {
      const payload = {
        id: user.id,
        email: user.email,
        first_name:
          (user.user_metadata && (user.user_metadata as any).first_name) || '',
        last_name:
          (user.user_metadata && (user.user_metadata as any).last_name) || '',
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert(payload)
        .select()
        .single();

      if (insertError) {
        Alert.alert('Error creating profile record', insertError.message);
        return;
      }

      finalProfile = inserted;
    }

    setProfile({
      id: finalProfile.id,
      first_name: finalProfile.first_name || '',
      last_name: finalProfile.last_name || '',
      email: finalProfile.email || '',
      password: '••••••••',
    });
  };

  const updateProfile = async () => {
    const session = await getSessionSafe();
    if (!session || !session.user) return;

    const userId = session.user.id;
    const { first_name, last_name, email } = profile;

    const { error } = await supabase
      .from('profiles')
      .update({ first_name, last_name, email })
      .eq('id', userId);

    if (error) {
      Alert.alert('Error updating profile', error.message);
    } else {
      Alert.alert('Profile updated!');
      setEditing(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
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

              // ✅ IMPORTANT: Replace YOUR_PROJECT_ID with your Supabase project ref
              // Example: https://abcxyzsupabase.functions.supabase.co/delete-user
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
                throw new Error(text || 'Failed to delete account');
              }

              await supabase.auth.signOut();
              Alert.alert('Deleted', 'Your account has been deleted.');
              router.replace('/login');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const handleChange = (key: string, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  return (
    <View style={styles.container}>
      <NavHeader helpTitle="Profile Info" helpText="Your basic information and login details." />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {editing ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={profile.first_name}
                onChangeText={(text) => handleChange('first_name', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={profile.last_name}
                onChangeText={(text) => handleChange('last_name', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={profile.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.saveButton} onPress={updateProfile}>
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>
                First Name: <Text style={styles.value}>{profile.first_name}</Text>
              </Text>
              <Text style={styles.label}>
                Last Name: <Text style={styles.value}>{profile.last_name}</Text>
              </Text>
              <Text style={styles.label}>
                Email: <Text style={styles.value}>{profile.email}</Text>
              </Text>
              <Text style={styles.label}>
                User ID: <Text style={styles.value}>{profile.id}</Text>
              </Text>
              <Text style={styles.label}>
                Password: <Text style={styles.value}>••••••••</Text>
              </Text>

              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#444',
  },
  value: {
    fontWeight: 'normal',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  editButton: {
    backgroundColor: '#888',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  editButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutButton: {
    backgroundColor: '#c62828',
    padding: 14,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // ✅ New Delete Account button
  deleteButton: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});





