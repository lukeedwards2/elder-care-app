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
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function ProfileInfo() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '', // for display only
  });

  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      Alert.alert('Error fetching user', userError?.message || 'No user found');
      return;
    }

    const userId = userData.user.id;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      Alert.alert('Error loading profile', error.message);
    } else {
      setProfile({
        ...data,
        password: '••••••••', // We never show real password
      });
    }
  };

  const updateProfile = async () => {
    const { first_name, last_name, email } = profile;
    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .update({ first_name, last_name, email })
      .eq('id', userData?.user?.id);

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

  const handleChange = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <View style={styles.container}>
      <NavHeader
        title="Profile Info"
        helpText="Your basic information and login details."
      />

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
              />
              <TouchableOpacity style={styles.saveButton} onPress={updateProfile}>
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>First Name: <Text style={styles.value}>{profile.first_name}</Text></Text>
              <Text style={styles.label}>Last Name: <Text style={styles.value}>{profile.last_name}</Text></Text>
              <Text style={styles.label}>Email: <Text style={styles.value}>{profile.email}</Text></Text>
              <Text style={styles.label}>User ID: <Text style={styles.value}>{profile.id}</Text></Text>
              <Text style={styles.label}>Password: <Text style={styles.value}>••••••••</Text></Text>
              <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    padding: 20,
  },
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
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#888',
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#c62828',
    padding: 14,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});




