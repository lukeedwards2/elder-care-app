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
      "ios": {}                                                   ns
    }
  }
}.                                                  



Backup _layout:

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



Backup Index:

// app/index.tsx
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { getSessionSafe } from '../lib/supabase';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSessionSafe();
        setLoggedIn(!!session);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    // Small loading screen while we check Supabase session
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // If logged in, go to Home tab; otherwise go to Login
  if (loggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});




Backup Lib supabase:

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




app/(tabs)/home.tsx backup:


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






Second backup to home.tsx:

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import NavHeader from '@/components/NavHeader';

const menuItems = [
  {
    title: 'Notes',
    image: require('../../assets/notes.png'),
    route: '/(tabs)/notes',
  },
  {
    title: 'Contacts',
    image: require('../../assets/contacts.png'),
    route: '/(tabs)/contacts',
  },
  {
    title: 'Chat',
    image: require('../../assets/photos.png'),
    route: '/(tabs)/photos',
  },
  {
    title: 'Supplies',
    image: require('../../assets/supplies.png'),
    route: '/(tabs)/supplies',
  },
  {
    title: 'Food',
    image: require('../../assets/food.png'),
    route: '/(tabs)/food',
  },
  {
    title: 'Action Needed',
    image: require('../../assets/action.png'),
    route: '/(tabs)/action',
  },
  {
    title: 'Documents',
    image: require('../../assets/documents.png'),
    route: '/(tabs)/documents',
  },
  {
    title: 'Rx',
    image: require('../../assets/rx.png'),
    route: '/(tabs)/rx',
  },
  {
    title: 'Emergency',
    image: require('../../assets/ambulance.png'),
    route: '/(tabs)/ambulance',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 768;

  // Keep the grid from stretching endlessly on iPad/Mac.
  const gridWidth = Math.min(width, 760);

  // Each item receives one-third of the usable grid width.
  const itemWidth = gridWidth / 3;

  // Keep icons similar to the iPhone design, but cap their growth on iPad.
  const iconSize = isTablet
    ? Math.min(itemWidth * 0.48, 105)
    : Math.min(width * 0.17, 72);

  // Slightly larger labels on iPad, without becoming oversized.
  const labelSize = isTablet ? 20 : Math.min(width * 0.039, 16);

  // Tablet spacing should grow a little, but never proportionally to
  // the entire screen height.
  const verticalSpacing = isTablet
    ? Math.min(height * 0.025, 28)
    : Math.min(height * 0.025, 22);

  const topPadding = isTablet
    ? Math.min(height * 0.045, 48)
    : Math.min(height * 0.04, 34);

  return (
    <View style={styles.container}>
      <NavHeader />

      <FlatList
        data={menuItems}
        numColumns={3}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.grid,
          {
            width: gridWidth,
            paddingTop: topPadding,
          },
        ]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                width: itemWidth,
                marginVertical: verticalSpacing,
              },
            ]}
            onPress={() => router.push(item.route)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.iconWrapper,
                {
                  width: iconSize * 1.1,
                  height: iconSize * 1.1,
                },
              ]}
            >
              <Image
                source={item.image}
                style={{
                  width: iconSize,
                  height: iconSize,
                }}
                resizeMode="contain"
              />
            </View>

            <Text
              style={[
                styles.label,
                {
                  fontSize: labelSize,
                },
              ]}
              numberOfLines={2}
            >
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
    backgroundColor: '#fff',
  },

  grid: {
    alignSelf: 'center',
    paddingBottom: 24,
    alignItems: 'center',
  },

  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },

  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
    color: '#000',
    fontFamily: Platform.select({
      ios: 'Avenir Next',
      android: 'sans-serif-light',
    }),
  },
});






app/(tabs)/_layout.tsx:

import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Image, TouchableOpacity, Linking, Animated } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  const handleGizmosPress = async () => {
    try {
      await Linking.openURL('https://gizmosforseniors.com');
    } catch (error) {
      console.warn('Failed to open Gizmos site:', error);
    }
    // ✅ IMPORTANT: make sure it routes to the tab home screen
    router.push('/(tabs)/home');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 95,
          backgroundColor: '#1976D2',
          paddingBottom: Platform.OS === 'ios' ? 10 : 6,
          paddingTop: Platform.OS === 'ios' ? 8 : 4,
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          letterSpacing: 0.3,
          marginTop: 4,
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
      }}
    >
      {/* 🏠 HOME */}
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: focused ? 1.2 : 1 }] },
              ]}
            >
              <Image
                source={require('../../assets/home.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? 'white' : 'rgba(255,255,255,0.6)' },
                ]}
              />
            </Animated.View>
          ),
        }}
      />

      {/* 🗓️ SCHEDULE */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => (
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: focused ? 1.2 : 1 }] },
              ]}
            >
              <Image
                source={require('../../assets/schedule.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? 'white' : 'rgba(255,255,255,0.6)' },
                ]}
              />
            </Animated.View>
          ),
        }}
      />

      {/* 🧭 GIZMOS */}
      <Tabs.Screen
        name="gizmos"
        options={{
          title: 'Gizmos',
          tabBarIcon: ({ focused }) => (
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: focused ? 1.25 : 1 }] },
              ]}
            >
              <Image
                source={require('../../assets/gizmos.png')}
                style={[styles.icon, { width: 32, height: 32, tintColor: undefined }]}
                resizeMode="contain"
              />
            </Animated.View>
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={handleGizmosPress} />
          ),
        }}
      />

      {/* 📰 SR NEWS */}
      <Tabs.Screen
        name="news"
        options={{
          title: 'Sr News',
          tabBarIcon: ({ focused }) => (
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: focused ? 1.2 : 1 }] },
              ]}
            >
              <Image
                source={require('../../assets/news10.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? 'white' : 'rgba(255,255,255,0.6)' },
                ]}
              />
            </Animated.View>
          ),
        }}
      />

      {/* 👤 ACCOUNT */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => (
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ scale: focused ? 1.2 : 1 }] },
              ]}
            >
              <Image
                source={require('../../assets/user.png')}
                style={[
                  styles.icon,
                  { tintColor: focused ? 'white' : 'rgba(255,255,255,0.6)' },
                ]}
              />
            </Animated.View>
          ),
        }}
      />

      {/* ✅ HIDDEN “HOME ICON” SCREENS (keeps tab bar visible but removes from bottom nav) */}
      <Tabs.Screen name="notes" options={{ href: null }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />


      {/* (Add these later if/when those files exist inside app/(tabs)/ ) */}
      {<Tabs.Screen name="photos" options={{ href: null }} />}
      {<Tabs.Screen name="contacts" options={{ href: null }} />}
      {<Tabs.Screen name="supplies" options={{ href: null }} />}
      {<Tabs.Screen name="food" options={{ href: null }} />}
      {<Tabs.Screen name="action" options={{ href: null }} />}
      {<Tabs.Screen name="documents" options={{ href: null }} /> }
      {<Tabs.Screen name="rx" options={{ href: null }} /> }
      {<Tabs.Screen name="ambulance" options={{ href: null }} /> }
    </Tabs>
  );
}

const styles = {
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 26,
    height: 26,
    marginBottom: 2,
  },
};





components.NavHeader.tsx backup:

import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NavHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeWrap, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Image
          source={require('../assets/app-logo2.png')} // TODO: replace with your real logo path
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeWrap: {
    backgroundColor: '#1976D2',
  },
  header: {
    height: 68,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  logo: {
    width: 125,
    height: 67,
  },
});



Oh okay, now that you explained that with all the test texts I did when trying to originally get the text screen working I definitely did type that it sometime. Just kinda scared me for a second i guess lol. Okay moving onto supplies: We have an app/supplies.tsx, an app/supplyDetail.tsx, an app/addSupply.tsx, and the wrapper app/(tabs)/supplies




Okay wow the design is very very good. Really love how you did that. There are some problems with this one though and it's probably cause I havent deleted app/addSupply.tsx. So I started to add a supply and I love how you did all those examples in the box and especially how it all looks. But once I added one supply and then went to add another supply: All the information from the previous one was in each box as I tried to make a new one. So let me know what you think about that and how to fix it. And then for the addNotes we have a cancel/go back so you can go back in the middle of adding/editing an note, can you do the same for supplies




import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import NavHeader from '../../components/NavHeader';

type EventType = {
  label: string;
  color: string;
  softColor: string;
};

type ScheduleEvent = {
  id: string;
  title: string;
  time: string;
  date: string;
  reminderTime: string | null;
  type: string;
  color: string;
};

const EVENT_TYPES: EventType[] = [
  {
    label: 'Doctor',
    color: '#E5534B',
    softColor: '#FDECEC',
  },
  {
    label: 'Family Visit',
    color: '#1976D2',
    softColor: '#EAF4FF',
  },
  {
    label: 'Guest/Friend',
    color: '#43A66B',
    softColor: '#ECF8F0',
  },
  {
    label: 'Social Event',
    color: '#D99B23',
    softColor: '#FFF7E6',
  },
  {
    label: 'Therapy',
    color: '#8A63D2',
    softColor: '#F3EDFF',
  },
];

const STORAGE_KEY = 'schedule_events';
const APP_BLUE = '#1976D2';

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(
    getTodayDateString()
  );

  const [events, setEvents] = useState<ScheduleEvent[]>([]);

  const [modalVisible, setModalVisible] = useState(false);

  const [newEventTitle, setNewEventTitle] = useState('');
  const [eventTime, setEventTime] = useState<Date | null>(null);
  const [reminderTime, setReminderTime] = useState<Date | null>(null);

  const [showEventTimePicker, setShowEventTimePicker] =
    useState(false);

  const [showReminderPicker, setShowReminderPicker] =
    useState(false);

  const [eventType, setEventType] = useState<EventType>(
    EVENT_TYPES[0]
  );

  useEffect(() => {
    loadEvents();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    try {
      await Notifications.requestPermissionsAsync();
    } catch (error) {
      console.log(
        'Unable to request notification permissions:',
        error
      );
    }
  };

  const loadEvents = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: ScheduleEvent[] = JSON.parse(saved);
        setEvents(parsed);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.log('Failed to load schedule events:', error);
    }
  };

  const saveEvents = async (
    updatedEvents: ScheduleEvent[]
  ) => {
    try {
      setEvents(updatedEvents);

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedEvents)
      );
    } catch (error) {
      console.log('Failed to save schedule events:', error);

      Alert.alert(
        'Unable to Save',
        'The event could not be saved. Please try again.'
      );
    }
  };

  const resetEventForm = () => {
    setNewEventTitle('');
    setEventTime(null);
    setReminderTime(null);

    setShowEventTimePicker(false);
    setShowReminderPicker(false);

    setEventType(EVENT_TYPES[0]);
  };

  const openAddEvent = () => {
    resetEventForm();
    setModalVisible(true);
  };

  const closeAddEvent = () => {
    resetEventForm();
    setModalVisible(false);
  };

  const handleAddEvent = async () => {
    const trimmedTitle = newEventTitle.trim();

    if (!trimmedTitle) {
      Alert.alert(
        'Event Title Needed',
        'Please enter a title for this event.'
      );
      return;
    }

    const newEvent: ScheduleEvent = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,

      title: trimmedTitle,

      time: eventTime
        ? formatClockTime(eventTime)
        : '',

      // This guarantees the event stays attached
      // to the exact calendar day the user selected.
      date: selectedDate,

      reminderTime: reminderTime
        ? reminderTime.toISOString()
        : null,

      type: eventType.label,
      color: eventType.color,
    };

    const updatedEvents = [...events, newEvent];

    await saveEvents(updatedEvents);

    if (reminderTime) {
      try {
        if (reminderTime.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'Upcoming Schedule Event',
              body: trimmedTitle,
              sound: true,
            },
            trigger: reminderTime,
          });
        }
      } catch (error) {
        console.log(
          'Unable to schedule reminder:',
          error
        );

        Alert.alert(
          'Event Saved',
          'Your event was saved, but the reminder could not be scheduled.'
        );
      }
    }

    closeAddEvent();
  };

  const confirmDeleteEvent = (event: ScheduleEvent) => {
    Alert.alert(
      'Delete Event?',
      `Remove "${event.title}" from your schedule?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(event.id),
        },
      ]
    );
  };

  const deleteEvent = async (eventId: string) => {
    const updatedEvents = events.filter(
      (event) => event.id !== eventId
    );

    await saveEvents(updatedEvents);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(
      (event) => event.date === selectedDate
    );
  }, [events, selectedDate]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    events.forEach((event) => {
      if (!marks[event.date]) {
        marks[event.date] = {
          dots: [],
        };
      }

      const existingColors = marks[event.date].dots.map(
        (dot: { color: string }) => dot.color
      );

      if (!existingColors.includes(event.color)) {
        marks[event.date].dots.push({
          color: event.color,
        });
      }
    });

    // Always highlight the selected day,
    // even when it has no events.
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: APP_BLUE,
      selectedTextColor: '#fff',
      dots: marks[selectedDate]?.dots || [],
    };

    return marks;
  }, [events, selectedDate]);

  const selectedDateLabel =
    formatDisplayDate(selectedDate);

  const selectedDateShortLabel =
    formatShortDate(selectedDate);

  const makeDateWithSelectedDay = (time: Date) => {
    const [year, month, day] = selectedDate
      .split('-')
      .map(Number);

    const combined = new Date(
      year,
      month - 1,
      day,
      time.getHours(),
      time.getMinutes(),
      0,
      0
    );

    return combined;
  };

  return (
    <View style={styles.container}>
      {/* NEW GLOBAL TOP NAV */}
      <NavHeader />

      <View style={styles.pageHeader}>
        <View style={styles.pageHeaderText}>
          <Text style={styles.pageTitle}>Schedule</Text>

          <Text style={styles.pageSubtitle}>
            Keep appointments and important events
            organized.
          </Text>
        </View>

        <View style={styles.headerIconCircle}>
          <Ionicons
            name="calendar-outline"
            size={28}
            color={APP_BLUE}
          />
        </View>
      </View>

      <View style={styles.calendarCard}>
        <Calendar
          current={selectedDate}
          markedDates={markedDates}
          markingType="multi-dot"
          onDayPress={(day) => {
            setSelectedDate(day.dateString);
          }}
          enableSwipeMonths
          theme={{
            backgroundColor: '#fff',
            calendarBackground: '#fff',

            textSectionTitleColor: '#8A97A8',

            selectedDayBackgroundColor: APP_BLUE,
            selectedDayTextColor: '#fff',

            todayTextColor: APP_BLUE,

            dayTextColor: '#243548',

            textDisabledColor: '#D5DDE5',

            arrowColor: APP_BLUE,

            monthTextColor: '#192330',

            textMonthFontWeight: '700',
            textMonthFontSize: 18,

            textDayHeaderFontWeight: '600',
            textDayHeaderFontSize: 13,

            textDayFontSize: 16,
          }}
        />
      </View>

      <View style={styles.selectedDayHeader}>
        <View>
          <Text style={styles.selectedLabel}>
            Selected day
          </Text>

          <Text style={styles.dateHeader}>
            {selectedDateLabel}
          </Text>
        </View>

        <View style={styles.eventCountBadge}>
          <Text style={styles.eventCountText}>
            {filteredEvents.length}{' '}
            {filteredEvents.length === 1
              ? 'event'
              : 'events'}
          </Text>
        </View>
      </View>

      {filteredEvents.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="calendar-clear-outline"
              size={38}
              color={APP_BLUE}
            />
          </View>

          <Text style={styles.emptyTitle}>
            Nothing scheduled
          </Text>

          <Text style={styles.emptyText}>
            Tap the + button to add an event for{' '}
            {selectedDateShortLabel}.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.eventCard}
              onLongPress={() =>
                confirmDeleteEvent(item)
              }
            >
              <View
                style={[
                  styles.eventColorBar,
                  {
                    backgroundColor: item.color,
                  },
                ]}
              />

              <View style={styles.eventContent}>
                <View style={styles.eventTopRow}>
                  <Text
                    style={styles.eventTitle}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  <View
                    style={[
                      styles.typeBadge,
                      {
                        backgroundColor:
                          getEventSoftColor(item.type),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBadgeText,
                        {
                          color: item.color,
                        },
                      ]}
                    >
                      {item.type}
                    </Text>
                  </View>
                </View>

                {item.time ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color="#728095"
                    />

                    <Text style={styles.eventTime}>
                      {item.time}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.eventDetailRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color="#728095"
                    />

                    <Text style={styles.eventTime}>
                      Time not specified
                    </Text>
                  </View>
                )}

                {item.reminderTime && (
                  <View style={styles.eventDetailRow}>
                    <Ionicons
                      name="notifications-outline"
                      size={18}
                      color="#728095"
                    />

                    <Text style={styles.eventTime}>
                      Reminder set
                    </Text>
                  </View>
                )}

                <Text style={styles.longPressHint}>
                  Press and hold to delete
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* KEEPING THE BLUE + BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={openAddEvent}
      >
        <AntDesign
          name="plus"
          size={34}
          color="#fff"
        />
      </TouchableOpacity>

      {/* ADD EVENT MODAL */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={closeAddEvent}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalTopRow}>
                <View style={styles.modalHeadingGroup}>
                  <View style={styles.modalIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={27}
                      color={APP_BLUE}
                    />
                  </View>

                  <View style={styles.modalHeadingText}>
                    <Text style={styles.modalTitle}>
                      Add Event
                    </Text>

                    <Text style={styles.modalSubtitle}>
                      {selectedDateLabel}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeAddEvent}
                >
                  <Ionicons
                    name="close"
                    size={26}
                    color="#5D6877"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.fieldLabel}>
                  Event title
                </Text>

                <TextInput
                  placeholder="Example: Doctor appointment"
                  placeholderTextColor="#AEB7C3"
                  style={styles.input}
                  value={newEventTitle}
                  onChangeText={setNewEventTitle}
                  autoCapitalize="sentences"
                />

                <Text style={styles.fieldLabel}>
                  Event time
                </Text>

                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={() =>
                    setShowEventTimePicker(true)
                  }
                >
                  <View style={styles.selectionLeft}>
                    <View style={styles.selectionIcon}>
                      <Ionicons
                        name="time-outline"
                        size={22}
                        color={APP_BLUE}
                      />
                    </View>

                    <View>
                      <Text
                        style={
                          eventTime
                            ? styles.selectionValue
                            : styles.selectionPlaceholder
                        }
                      >
                        {eventTime
                          ? formatClockTime(eventTime)
                          : 'Choose event time'}
                      </Text>

                      <Text style={styles.selectionHint}>
                        Optional
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#A4AFBC"
                  />
                </TouchableOpacity>

                {showEventTimePicker && (
                  <DateTimePicker
                    value={eventTime || new Date()}
                    mode="time"
                    is24Hour={false}
                    display={
                      Platform.OS === 'ios'
                        ? 'spinner'
                        : 'default'
                    }
                    onChange={(
                      _event,
                      selectedTime
                    ) => {
                      if (Platform.OS !== 'ios') {
                        setShowEventTimePicker(false);
                      }

                      if (selectedTime) {
                        setEventTime(selectedTime);
                      }
                    }}
                  />
                )}

                {Platform.OS === 'ios' &&
                  showEventTimePicker && (
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() =>
                        setShowEventTimePicker(false)
                      }
                    >
                      <Text
                        style={styles.pickerDoneText}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}

                <Text style={styles.fieldLabel}>
                  Reminder
                </Text>

                <TouchableOpacity
                  style={styles.selectionButton}
                  onPress={() =>
                    setShowReminderPicker(true)
                  }
                >
                  <View style={styles.selectionLeft}>
                    <View style={styles.selectionIcon}>
                      <Ionicons
                        name="notifications-outline"
                        size={22}
                        color={APP_BLUE}
                      />
                    </View>

                    <View>
                      <Text
                        style={
                          reminderTime
                            ? styles.selectionValue
                            : styles.selectionPlaceholder
                        }
                      >
                        {reminderTime
                          ? formatClockTime(
                              reminderTime
                            )
                          : 'Set reminder time'}
                      </Text>

                      <Text style={styles.selectionHint}>
                        Optional
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color="#A4AFBC"
                  />
                </TouchableOpacity>

                {showReminderPicker && (
                  <DateTimePicker
                    value={
                      reminderTime || new Date()
                    }
                    mode="time"
                    is24Hour={false}
                    display={
                      Platform.OS === 'ios'
                        ? 'spinner'
                        : 'default'
                    }
                    onChange={(
                      _event,
                      selectedTime
                    ) => {
                      if (Platform.OS !== 'ios') {
                        setShowReminderPicker(false);
                      }

                      if (selectedTime) {
                        const combined =
                          makeDateWithSelectedDay(
                            selectedTime
                          );

                        setReminderTime(combined);
                      }
                    }}
                  />
                )}

                {Platform.OS === 'ios' &&
                  showReminderPicker && (
                    <TouchableOpacity
                      style={styles.pickerDoneButton}
                      onPress={() =>
                        setShowReminderPicker(false)
                      }
                    >
                      <Text
                        style={styles.pickerDoneText}
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  )}

                {reminderTime && (
                  <TouchableOpacity
                    onPress={() =>
                      setReminderTime(null)
                    }
                  >
                    <Text
                      style={styles.removeReminder}
                    >
                      Remove reminder
                    </Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.fieldLabel}>
                  Event type
                </Text>

                <View style={styles.tagContainer}>
                  {EVENT_TYPES.map((type) => {
                    const selected =
                      eventType.label === type.label;

                    return (
                      <TouchableOpacity
                        key={type.label}
                        style={[
                          styles.tagOption,
                          {
                            backgroundColor:
                              selected
                                ? type.color
                                : type.softColor,

                            borderColor: selected
                              ? type.color
                              : 'transparent',
                          },
                        ]}
                        onPress={() =>
                          setEventType(type)
                        }
                      >
                        <View
                          style={[
                            styles.tagDot,
                            {
                              backgroundColor:
                                selected
                                  ? '#fff'
                                  : type.color,
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.tagText,
                            {
                              color: selected
                                ? '#fff'
                                : type.color,
                            },
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Pressable
                  style={styles.saveButton}
                  onPress={handleAddEvent}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={23}
                    color="#fff"
                  />

                  <Text
                    style={styles.saveButtonText}
                  >
                    Save Event
                  </Text>
                </Pressable>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeAddEvent}
                >
                  <Text
                    style={styles.cancelButtonText}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(
    today.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    today.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function dateFromDateString(dateString: string) {
  const [year, month, day] = dateString
    .split('-')
    .map(Number);

  return new Date(year, month - 1, day);
}

function formatDisplayDate(dateString: string) {
  return dateFromDateString(
    dateString
  ).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(dateString: string) {
  return dateFromDateString(
    dateString
  ).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
  });
}

function formatClockTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getEventSoftColor(typeLabel: string) {
  const type = EVENT_TYPES.find(
    (eventType) =>
      eventType.label === typeLabel
  );

  return type?.softColor || '#EEF3F8';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },

  pageHeader: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  pageHeaderText: {
    flex: 1,
    paddingRight: 12,
  },

  pageTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#18212D',
    letterSpacing: -0.5,
  },

  pageSubtitle: {
    fontSize: 16,
    color: '#8390A1',
    lineHeight: 22,
    marginTop: 4,
  },

  headerIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#D8E0E8',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarCard: {
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 22,
    backgroundColor: '#fff',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E1E7EE',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: {
          width: 0,
          height: 3,
        },
      },

      android: {
        elevation: 2,
      },
    }),
  },

  selectedDayHeader: {
    marginHorizontal: 18,
    marginTop: 17,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  selectedLabel: {
    color: '#8895A5',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },

  dateHeader: {
    color: '#18212D',
    fontSize: 19,
    fontWeight: '750',
  },

  eventCountBadge: {
    backgroundColor: '#EAF4FF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },

  eventCountText: {
    color: APP_BLUE,
    fontWeight: '700',
    fontSize: 13,
  },

  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingTop: 35,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  emptyTitle: {
    color: '#18212D',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 7,
  },

  emptyText: {
    color: '#8995A5',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },

  eventsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },

  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DEE5EC',
    overflow: 'hidden',
    marginBottom: 12,

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: {
          width: 0,
          height: 3,
        },
      },

      android: {
        elevation: 1,
      },
    }),
  },

  eventColorBar: {
    width: 7,
  },

  eventContent: {
    flex: 1,
    padding: 15,
  },

  eventTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },

  eventTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#18212D',
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 5,
  },

  eventTime: {
    color: '#69778A',
    fontSize: 14,
  },

  longPressHint: {
    fontSize: 11,
    color: '#A5AFBB',
    marginTop: 10,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,

    backgroundColor: APP_BLUE,

    width: 64,
    height: 64,
    borderRadius: 32,

    justifyContent: 'center',
    alignItems: 'center',

    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.22,
        shadowRadius: 10,
        shadowOffset: {
          width: 0,
          height: 5,
        },
      },

      android: {
        elevation: 7,
      },
    }),
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 24, 34, 0.48)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 40,
  },

  modalContent: {
    backgroundColor: '#F7F9FC',
    borderRadius: 26,
    padding: 18,
    maxHeight: '90%',
  },

  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  modalHeadingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  modalIcon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  modalHeadingText: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 23,
    color: '#18212D',
    fontWeight: '800',
  },

  modalSubtitle: {
    fontSize: 14,
    color: '#8693A4',
    marginTop: 2,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDF1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DFE6ED',
    padding: 16,
  },

  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#455466',
    marginBottom: 8,
    marginTop: 3,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D4DDE7',
    backgroundColor: '#FAFBFD',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    fontSize: 16,
    color: '#18212D',
    marginBottom: 17,
  },

  selectionButton: {
    borderWidth: 1,
    borderColor: '#D4DDE7',
    backgroundColor: '#FAFBFD',
    borderRadius: 15,
    minHeight: 68,
    paddingHorizontal: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  selectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },

  selectionValue: {
    color: '#273342',
    fontSize: 16,
    fontWeight: '650',
  },

  selectionPlaceholder: {
    color: '#8E9BAB',
    fontSize: 16,
  },

  selectionHint: {
    color: '#A3ADBA',
    fontSize: 12,
    marginTop: 2,
  },

  pickerDoneButton: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },

  pickerDoneText: {
    color: APP_BLUE,
    fontSize: 16,
    fontWeight: '700',
  },

  removeReminder: {
    alignSelf: 'flex-end',
    color: '#C8453D',
    fontSize: 13,
    fontWeight: '600',
    marginTop: -8,
    marginBottom: 15,
  },

  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 19,
  },

  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  tagText: {
    fontSize: 13,
    fontWeight: '700',
  },

  saveButton: {
    backgroundColor: APP_BLUE,
    minHeight: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  cancelButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  cancelButtonText: {
    color: '#6E7B8B',
    fontSize: 15,
    fontWeight: '650',
  },
});