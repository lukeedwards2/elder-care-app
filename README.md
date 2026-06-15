# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions






supabase backup:

// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

// Enable persist session + detect session in production
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Global session holder
let cachedSession = null;

// Restore session on app start
(async () => {
  const { data } = await supabase.auth.getSession();
  cachedSession = data.session ?? null;
})();

// Watch for any login/logout/update
supabase.auth.onAuthStateChange((_event, session) => {
  cachedSession = session;
});

/** Returns a guaranteed session or null */
export async function getSessionSafe() {
  if (cachedSession) return cachedSession;
  const { data } = await supabase.auth.getSession();
  cachedSession = data.session;
  return cachedSession;
}




profile.tsx backup:

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '../../components/NavHeader';

const options = [
  { label: 'Profile', route: '/profileInfo' },
  { label: 'Subscriptions', route: '/subscription' },
  { label: 'Team Members', route: '/team-members' },
  { label: 'Amazon Links', route: '/account/amazon-links' },
  { label: 'About Us', route: '/aboutUs' },
  { label: 'Contact Us', route: '/contactUs' },
];

export default function AccountScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavHeader
        title="Account"
        helpText="Manage your account settings and view information about the CareKeeper Hub."
      />

      <FlatList
        data={options}
        keyExtractor={(item) => item.label}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(item.route)}
          >
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f9fc' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
});





profileInfo.tsx backup:

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
    password: '',
  });

  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const session = await getSessionSafe();
    if (!session) {
      Alert.alert('Error fetching user', 'Auth session missing!');
      return;
    }

    const userId = session.user.id;

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
        password: '••••••••',
      });
    }
  };

  const updateProfile = async () => {
    const session = await getSessionSafe();
    if (!session) return;

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

  const handleChange = (key, value) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

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
});















team members backup:

// team-members.tsx
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
} from 'react-native';
import { supabase, getSessionSafe } from '../lib/supabase';

export default function TeamMembers() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);

    const session = await getSessionSafe();
    if (!session) {
      Alert.alert('Error', 'Auth session missing.');
      setLoading(false);
      return;
    }

    const mainUserId = session.user.id;

    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('main_user_id', mainUserId);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setTeamMembers(data || []);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    const session = await getSessionSafe();
    if (!session) {
      Alert.alert('Error', 'Auth session missing.');
      return;
    }

    if (!form.name || !form.email) {
      Alert.alert('Please fill out both fields.');
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      main_user_id: session.user.id,
      role: 'Team Member',
      profile_image_url: session.user.user_metadata?.profile_image_url || null,
    };

    if (editingMember) {
      const { error } = await supabase
        .from('team_members')
        .update(payload)
        .eq('id', editingMember.id);

      if (error) {
        Alert.alert('Error updating team member', error.message);
        return;
      }
    } else {
      const { error } = await supabase.from('team_members').insert([payload]);
      if (error) {
        Alert.alert('Error adding team member', error.message);
        return;
      }
    }

    setModalVisible(false);
    setEditingMember(null);
    setForm({ name: '', email: '' });
    fetchTeamMembers();
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setForm({ name: member.name, email: member.email });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Alert.alert('Confirm Delete', 'Are you sure?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('team_members').delete().eq('id', id);
          if (error) {
            Alert.alert('Error deleting', error.message);
          } else {
            fetchTeamMembers();
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.memberBox}>
      <Text style={styles.memberText}>{item.name} — {item.email}</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => handleEdit(item)}>
          <Text style={styles.edit}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Text style={styles.delete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Members</Text>

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={teamMembers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={<Text>No team members added yet.</Text>}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>Add Team Member</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            {editingMember ? 'Edit Team Member' : 'Add Team Member'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            value={form.name}
            onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={form.email}
            onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModalVisible(false);
                setEditingMember(null);
                setForm({ name: '', email: '' });
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  memberBox: {
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  memberText: {
    fontSize: 16,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  edit: { color: '#1976D2', marginRight: 20 },
  delete: { color: 'red' },
  addButton: {
    backgroundColor: '#1976D2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    padding: 22,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    top: '30%',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, alignSelf: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 14,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#888',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
  },
  saveText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { color: '#fff', fontWeight: 'bold' },
});




Layout:

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}



Navheader backup:

// components/NavHeader.tsx
import React, { useState } from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Modal,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NavHeaderProps {
  helpTitle: string;
  helpText: string;
}

export default function NavHeader({ helpTitle, helpText }: NavHeaderProps) {
  const [helpVisible, setHelpVisible] = useState(false);

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.navHeader}>
          {/* Left profile image */}
          <Image
            source={require('../assets/newProfileImage.png')}
            style={styles.profile}
          />

          {/* (If you ever want a center logo, it can go here) */}

          {/* Right help icon */}
          <TouchableOpacity onPress={() => setHelpVisible(true)}>
            <Image
              source={require('../assets/light-bulb.png')}
              style={styles.helpIcon}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Help Modal */}
      <Modal visible={helpVisible} transparent animationType="slide">
        <View style={styles.helpOverlay}>
          <View style={styles.helpBox}>
            <Text style={styles.helpTitle}>{helpTitle}</Text>
            <Text style={styles.helpText}>{helpText}</Text>
            <Pressable
              style={styles.saveButton}
              onPress={() => setHelpVisible(false)}
            >
              <Text style={styles.saveButtonText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#1976D2', // fills behind status bar
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8, // small inner padding; SafeArea gives us the rest
    // If you still want curved bottom corners, keep these;
    // if you want a perfect rectangle, set them to 0.
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profile: { width: 45, height: 45, borderRadius: 25 },
  helpIcon: { width: 34, height: 34 },

  helpOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  helpBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  helpTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});



New layout backup:

// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

// Keep splash until fonts are loaded
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore if already hidden */
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Auth gate lives in app/index.tsx */}
        <Stack.Screen name="index" />

        {/* Auth screens */}
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="profileInfo" />

        {/* Main tabbed app */}
        <Stack.Screen name="(tabs)" />

        {/* Other top-level screens still work */}
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}




subscription backup:  

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import NavHeader from '../components/NavHeader';

// 🚫 REMOVE / COMMENT OUT REAL IMPORT (BREAKS BUILD IN PREVIEW MODE)
// import * as InAppPurchases from 'expo-in-app-purchases';

// ✅ TEMP MOCK SO THE SCREEN LOADS IN DEVELOPMENT & ON EAS BUILD
const InAppPurchases = {
  connectAsync: async () => ({ responseCode: 0 }),
  getProductsAsync: async () => ({
    results: [
      { productId: 'premium_monthly' },
      { productId: 'premium_yearly' },
    ],
  }),
  requestPurchaseAsync: async () => {},
  restorePurchasesAsync: async () => ({ responseCode: 0, results: [] }),
  setPurchaseListener: () => ({ remove: () => {} }),
  disconnectAsync: async () => {},
  IAPResponseCode: { OK: 0, USER_CANCELED: 1 },
  finishTransactionAsync: async () => {},
};

const productIds = Platform.select({
  ios: ['premium_monthly', 'premium_yearly'],
  android: [],
});

export default function SubscriptionPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const connectAndFetch = async () => {
      try {
        const { responseCode } = await InAppPurchases.connectAsync();
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          const items = await InAppPurchases.getProductsAsync(productIds);
          setProducts(items.results || []);
        }
      } catch (error) {
        console.log('IAP init error:', error);
        Alert.alert('Error', 'Unable to connect to App Store. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    connectAndFetch();

    const subscription = InAppPurchases.setPurchaseListener(() => {});
    return () => {
      subscription.remove();
      InAppPurchases.disconnectAsync();
    };
  }, []);

  const handleSubscribe = async (productId: string) => {
    Alert.alert('Preview Mode', `Pretending to subscribe to: ${productId}`);
  };

  const handleRestore = async () => {
    Alert.alert('Preview Mode', 'Pretending to restore purchases.');
  };

  return (
    <View style={styles.container}>
      <NavHeader
        helpTitle="Premium Subscription"
        helpText="Subscribe to unlock premium features like enhanced caregiving tools and unlimited usage."
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.description}>
          Subscribing gives you access to extra features to make caregiving easier
          and more efficient.
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1976D2" style={{ marginTop: 40 }} />
        ) : (
          <>
            {products.map((product) => (
              <View key={product.productId} style={styles.optionBox}>
                <Text style={styles.priceTitle}>
                  {product.productId.includes('monthly')
                    ? 'Premium Monthly – $4.95'
                    : 'Premium Yearly – $48'}
                </Text>

                <Text style={styles.trial}>7-day free trial included</Text>

                <TouchableOpacity
                  style={styles.subscribeButton}
                  onPress={() => handleSubscribe(product.productId)}
                >
                  <Text style={styles.subscribeText}>Subscribe Now</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        <TouchableOpacity onPress={handleRestore} style={styles.restoreLink}>
          <Text style={styles.restoreText}>Restore Purchases</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  content: {
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    color: '#222',
    textAlign: 'center',
  },

  description: {
    fontSize: 17,
    color: '#444',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: '90%',
  },

  optionBox: {
    width: '100%',
    alignItems: 'center',
    borderColor: '#1976D2',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 24,
    marginBottom: 24,
    backgroundColor: '#F9FBFF',
  },

  priceTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 10,
  },

  trial: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
  },

  subscribeButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },

  subscribeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  restoreLink: {
    marginTop: 10,
    marginBottom: 40,
  },

  restoreText: {
    color: '#777',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
});




profileInfo backup: 

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

    // Try to fetch an existing profile row
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle(); // <- important change

    if (error) {
      Alert.alert('Error loading profile', error.message);
      return;
    }

    // If no row exists yet, create one automatically
    let finalProfile = data;
    if (!finalProfile) {
      const payload = {
        id: user.id, // matches auth.uid()
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

  const handleChange = (key: string, value: string) =>
    setProfile((prev) => ({ ...prev, [key]: value }));

  return (
    <View style={styles.container}>
      <NavHeader
        helpTitle="Profile Info"
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
                autoCapitalize="none"
              />
              <TouchableOpacity style={styles.saveButton} onPress={updateProfile}>
                <Text style={styles.saveButtonText}>Save Profile</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>
                First Name:{' '}
                <Text style={styles.value}>{profile.first_name}</Text>
              </Text>
              <Text style={styles.label}>
                Last Name:{' '}
                <Text style={styles.value}>{profile.last_name}</Text>
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

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
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
});




alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id)
  on delete cascade;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id)
  on delete cascade;

alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id)
  on delete cascade;






// lib/supabase.ts
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// ✅ Never throw at module import time (prevents TestFlight launch crashes)
export function assertSupabaseConfigured(): { ok: true } | { ok: false; message: string } {
  if (isConfigured) return { ok: true };
  return {
    ok: false,
    message:
      'Supabase env vars are missing in this build.\n\nMake sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set for your EAS production build.',
  };
}

// Create a client even if missing env vars (so imports don’t crash the app)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// --- ✅ Crash-prevention: keep a cached session in memory ---
let cachedSession: Session | null = null;

// Bootstrap once (don’t crash even if misconfigured)
(async () => {
  try {
    if (!isConfigured) return;
    const { data, error } = await supabase.auth.getSession();
    if (!error) cachedSession = data.session ?? null;
  } catch (e) {
    console.error('Supabase bootstrap session error:', e);
  }
})();

// Keep cache updated on login/logout/token refresh
supabase.auth.onAuthStateChange((_event, session) => {
  cachedSession = session;
});

/**
 * Safe helper to get the current auth session.
 * Never throws – returns Session | null.
 */
export async function getSessionSafe(): Promise<Session | null> {
  try {
    if (!isConfigured) return null;
    if (cachedSession) return cachedSession;

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting Supabase session:', error);
      return null;
    }

    cachedSession = data.session ?? null;
    return cachedSession;
  } catch (e) {
    console.error('Unexpected error in getSessionSafe:', e);
    return null;
  }
}



























































backup Menu items:

const menuItems = [
  { title: 'Notes', image: require('../../assets/notes.png'), route: '/notes' },
  { title: 'Contacts', image: require('../../assets/contacts.png'), route: '/contacts' },
  { title: 'Chat', image: require('../../assets/photos.png'), route: '/photos' },
  { title: 'Supplies', image: require('../../assets/supplies.png'), route: '/supplies' },
  { title: 'Food', image: require('../../assets/food.png'), route: '/food' },
  { title: 'Action Needed', image: require('../../assets/action.png'), route: '/action' },
  { title: 'Documents', image: require('../../assets/documents.png'), route: '/documents' },
  { title: 'Rx', image: require('../../assets/rx.png'), route: '/rx' },
  { title: 'Emergency', image: require('../../assets/ambulance.png'), route: '/ambulance' },
];









lip supabase backup:


// lib/supabase.ts
import { createClient, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// --- ✅ Crash-prevention: keep a cached session in memory ---
let cachedSession: Session | null = null;
let sessionBootstrapped = false;

// Bootstrap once (don’t block app render, just populate cache ASAP)
(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (!error) cachedSession = data.session ?? null;
  } catch (e) {
    // Don’t crash the app if session restore fails
    console.error('Supabase bootstrap session error:', e);
  } finally {
    sessionBootstrapped = true;
  }
})();

// Keep cache updated on login/logout/token refresh
supabase.auth.onAuthStateChange((_event, session) => {
  cachedSession = session;
});

/**
 * Safe helper to get the current auth session.
 * Uses in-memory cache first to avoid startup race crashes.
 * Never throws – returns Session | null.
 */
export async function getSessionSafe(): Promise<Session | null> {
  try {
    // If we already have it, return instantly
    if (cachedSession) return cachedSession;

    // If bootstrap hasn't finished yet, try one fresh read
    // (This helps right at app launch)
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting Supabase session:', error);
      return null;
    }

    cachedSession = data.session ?? null;
    return cachedSession;
  } catch (e) {
    console.error('Unexpected error in getSessionSafe:', e);
    return null;
  }
}








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
  ActivityIndicator,
} from 'react-native';
import NavHeader from '../components/NavHeader';
import { supabase, getSessionSafe } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function ProfileInfo() {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

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
    try {
      setBusy(true);

      const session = await getSessionSafe();
      if (!session || !session.user) {
        Alert.alert('Error fetching user', 'Auth session missing!');
        return;
      }

      const user = session.user;

      // Try to fetch an existing profile row
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        Alert.alert('Error loading profile', error.message);
        return;
      }

      // If no row exists yet, create one automatically
      let finalProfile = data;
      if (!finalProfile) {
        const payload = {
          id: user.id, // matches auth.uid()
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
    } finally {
      setBusy(false);
    }
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

  // ✅ Apple-required delete flow (calls your Edge Function)
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data (team members + subscriptions). This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setBusy(true);

              // This requires you to create an Edge Function named "delete-account"
              const { error } = await supabase.functions.invoke('delete-account');

              if (error) {
                Alert.alert('Delete failed', error.message);
                return;
              }

              // Session is now invalid because the user is deleted; ensure we clear client state
              await supabase.auth.signOut();

              Alert.alert('Account deleted', 'Your account has been permanently deleted.');
              router.replace('/signup'); // or '/login' if you prefer
            } catch (e: any) {
              Alert.alert('Delete failed', e?.message || 'Unknown error');
            } finally {
              setBusy(false);
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
      <NavHeader
        helpTitle="Profile Info"
        helpText="Your basic information and login details."
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {busy ? (
            <View style={styles.busyWrap}>
              <ActivityIndicator size="large" />
              <Text style={styles.busyText}>Working…</Text>
            </View>
          ) : null}

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
              <TouchableOpacity
                style={[styles.saveButton, busy && styles.disabled]}
                onPress={updateProfile}
                disabled={busy}
              >
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

              <TouchableOpacity
                style={[styles.editButton, busy && styles.disabled]}
                onPress={() => setEditing(true)}
                disabled={busy}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.logoutButton, busy && styles.disabled]}
            onPress={handleLogout}
            disabled={busy}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          {/* ✅ Apple-required: account deletion */}
          <TouchableOpacity
            style={[styles.deleteButton, busy && styles.disabled]}
            onPress={handleDeleteAccount}
            disabled={busy}
          >
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

  busyWrap: { alignItems: 'center', marginBottom: 14 },
  busyText: { marginTop: 8, color: '#555' },

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

  deleteButton: {
    backgroundColor: '#8e0000',
    padding: 14,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  disabled: { opacity: 0.6 },
});





home backup:

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '@/components/NavHeader';

const { width, height } = Dimensions.get('window');

// Dynamic scaling so icons and spacing adjust for different screen sizes
const baseWidth = 390; // reference iPhone 14 width
const scale = width / baseWidth;
const iconSize = width * 0.17 * scale;

const menuItems = [
  { title: 'Notes', image: require('../../assets/notes.png'), route: '/(tabs)/notes' },
  { title: 'Contacts', image: require('../../assets/contacts.png'), route: '/(tabs)/contacts' },
  { title: 'Chat', image: require('../../assets/photos.png'), route: '/(tabs)/photos' },
  { title: 'Supplies', image: require('../../assets/supplies.png'), route: '/(tabs)/supplies' },
  { title: 'Food', image: require('../../assets/food.png'), route: '/(tabs)/food' },
  { title: 'Action Needed', image: require('../../assets/action.png'), route: '/(tabs)/action' },
  { title: 'Documents', image: require('../../assets/documents.png'), route: '/(tabs)/documents' },
  { title: 'Rx', image: require('../../assets/rx.png'), route: '/(tabs)/rx' },
  { title: 'Emergency', image: require('../../assets/ambulance.png'), route: '/(tabs)/ambulance' },
];


export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavHeader
        helpTitle="Home Help"
        helpText="This is your home screen. Tap any icon to manage caregiving tasks like notes, contacts, or medicine reminders."
      />

      <FlatList
        data={menuItems}
        numColumns={3}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push(item.route)}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrapper}>
              <Image source={item.image} style={styles.icon} resizeMode="contain" />
            </View>
            <Text style={styles.label}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  grid: {
    paddingTop: height * 0.06 * scale,
    paddingBottom: height * 0.02 * scale,
    paddingHorizontal: width * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    width: width / 3.3,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: height * 0.035 * scale, // vertical spacing unchanged
  },
  iconWrapper: {
    width: iconSize * 1.1,
    height: iconSize * 1.1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: iconSize,
    height: iconSize,
  },
  label: {
    marginTop: 8 * scale,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: width * 0.039,
    color: '#000',
    fontFamily: Platform.select({
      ios: 'Avenir Next', // ✅ modern, sleek, professional iOS font
      android: 'sans-serif-light', // ✅ clean Android alternative
    }),
  },
});









import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '@/components/NavHeader';

const { width, height } = Dimensions.get('window');

const isTablet = width >= 768;
const numColumns = 3;

const menuItems = [
  { title: 'Notes', image: require('../../assets/notes.png'), route: '/(tabs)/notes' },
  { title: 'Contacts', image: require('../../assets/contacts.png'), route: '/(tabs)/contacts' },
  { title: 'Chat', image: require('../../assets/photos.png'), route: '/(tabs)/photos' },
  { title: 'Supplies', image: require('../../assets/supplies.png'), route: '/(tabs)/supplies' },
  { title: 'Food', image: require('../../assets/food.png'), route: '/(tabs)/food' },
  { title: 'Action Needed', image: require('../../assets/action.png'), route: '/(tabs)/action' },
  { title: 'Documents', image: require('../../assets/documents.png'), route: '/(tabs)/documents' },
  { title: 'Rx', image: require('../../assets/rx.png'), route: '/(tabs)/rx' },
  { title: 'Emergency', image: require('../../assets/ambulance.png'), route: '/(tabs)/ambulance' },
];

export default function HomeScreen() {
  const router = useRouter();

  const contentWidth = isTablet ? 720 : width;
  const horizontalPadding = isTablet ? 24 : 16;
  const itemWidth = (contentWidth - horizontalPadding * 2) / numColumns;
  const iconSize = isTablet ? 88 : Math.min(width * 0.18, 78);

  return (
    <View style={styles.container}>
      <NavHeader
        helpTitle="Home Help"
        helpText="This is your home screen. Tap any icon to manage caregiving tasks like notes, contacts, or medicine reminders."
      />

      <FlatList
        data={menuItems}
        numColumns={numColumns}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.grid,
          {
            paddingTop: isTablet ? 36 : 24,
            paddingBottom: isTablet ? 40 : 24,
            paddingHorizontal: horizontalPadding,
            width: contentWidth,
            alignSelf: 'center',
          },
        ]}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.menuItem, { width: itemWidth }]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconWrapper, { width: iconSize + 18, height: iconSize + 18 }]}>
              <Image
                source={item.image}
                style={{ width: iconSize, height: iconSize }}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.label, { fontSize: isTablet ? 22 : 16 }]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4',
  },
  grid: {
    alignItems: 'center',
  },
  row: {
    justifyContent: 'space-between',
    width: '100%',
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 34,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  label: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#000',
    lineHeight: Platform.OS === 'ios' ? 24 : 22,
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif',
      default: undefined,
    }),
  },
});