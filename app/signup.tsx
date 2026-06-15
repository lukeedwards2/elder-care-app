import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { supabase, assertSupabaseConfigured } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function SignUp() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
  });

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSignUp = async () => {
    const { email, password, first_name, last_name } = form;

    const cfg = assertSupabaseConfigured();
    if (!cfg.ok) {
      Alert.alert('Config Error', cfg.message);
      return;
    }

    if (!email || !password || !first_name || !last_name) {
      Alert.alert('Missing Information', 'Please fill out all fields.');
      return;
    }

    try {
      // Helpful debug logs in Metro
      console.log('SignUp: using Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
      console.log('SignUp: attempting signup for email:', email);

      // Create auth user + store basic metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
          },
        },
      });

      if (error) {
        console.log('Supabase signUp error:', error);
        Alert.alert('Signup Error', error.message || 'Unable to sign up. Please try again.');
        return;
      }

      const userId = data?.user?.id;
      console.log('SignUp: created user with id:', userId);

      if (!userId) {
        Alert.alert(
          'Signup Error',
          'Something went wrong with authentication. Please try again.'
        );
        return;
      }

      // Insert into profiles table
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: userId,
          email,
          first_name,
          last_name,
        },
      ]);

      if (profileError) {
        console.log('Profile insert error:', profileError);
        Alert.alert(
          'Profile Error',
          `Signup succeeded, but profile insert failed: ${profileError.message}`
        );
        return;
      }

      Alert.alert('Success!', 'Your account has been created.');
      router.replace('/(tabs)/home');
    } catch (err: any) {
      // This will catch real network-level problems
      console.log('SignUp exception (likely network-level):', err);
      Alert.alert(
        'Signup Error',
        err?.message || 'Network error. Please check your connection and try again.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Sign Up</Text>

        <TextInput
          style={styles.input}
          placeholder="First Name"
          value={form.first_name}
          onChangeText={(text) => handleChange('first_name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          value={form.last_name}
          onChangeText={(text) => handleChange('last_name', text)}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={form.email}
          onChangeText={(text) => handleChange('email', text)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={form.password}
          onChangeText={(text) => handleChange('password', text)}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>

        {/* Navigation to Login */}
        <View style={styles.linkContainer}>
          <Text>
            Already have an account?{' '}
            <Text style={styles.linkText} onPress={() => router.push('/login')}>
              Log in
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#1976D2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  linkContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#1976D2',
    fontWeight: 'bold',
  },
});



