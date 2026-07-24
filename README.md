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





backup Navheader: 


import React from 'react';
import { View, Image, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  onHelpPress?: () => void;
}
export default function NavHeader({ onHelpPress }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeWrap, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.left}>
          {/* TODO: replace with your logo image source */}
          {/* <Image source={require('../assets/logo.png')} style={styles.logo} /> */}
          <View style={styles.logoPlaceholder} />
        </View>

        <Pressable onPress={onHelpPress} hitSlop={12} style={styles.right}>
          {/* TODO: replace with your lightbulb image source */}
          {/* <Image source={require('../assets/lightbulb.png')} style={styles.bulb} /> */}
          <View style={styles.bulbPlaceholder} />
        </Pressable>
      </View>
    </View>
  ); 
}

const styles = StyleSheet.create({
  // This is what prevents the “white above/edges” issue:
  safeWrap: {
    backgroundColor: '#1976D2',
  },

  // Control header height here (this fixes “blue goes too far down”):
  header: {
    height: 92, // tweak: try 80–96 until it matches your “original”
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',

    // If you want rounded bottom corners:
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#1976D2',
  },

  left: { justifyContent: 'flex-end' },
  right: { justifyContent: 'flex-end' },

  // placeholders so it compiles even before you wire images:
  logoPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.35)' },
  bulbPlaceholder: { width: 38, height: 38, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.35)' },
});






backup home.tsx:


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





Backup eas.json:

{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://zgxaldtqtvaloulhdmyw.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpneGFsZHRxdHZhbG91bGhkbXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4OTUwOTYsImV4cCI6MjA3MTQ3MTA5Nn0.ofFSKkZMh13sR8zqpHNW9cix8hgOsnTlwFTozq1K5Ww"
      },
      "ios": {
        "distribution": "store"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {}
    }
  }
}
