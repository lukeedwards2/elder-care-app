// app/index.tsx

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';

import { getSessionSafe } from '../lib/supabase';

const SESSION_TIMEOUT_MS = 8000;

export default function Index() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const checkSession = async () => {
      try {
        const timeoutPromise = new Promise<null>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn(
              'Supabase session check timed out. Continuing to login screen.'
            );
            resolve(null);
          }, SESSION_TIMEOUT_MS);
        });

        const session = await Promise.race([
          getSessionSafe(),
          timeoutPromise,
        ]);

        if (isMounted) {
          setLoggedIn(Boolean(session));
        }
      } catch (error) {
        console.error('Startup session check failed:', error);

        // A session-check failure should never trap the user
        // on a blank launch screen.
        if (isMounted) {
          setLoggedIn(false);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        if (isMounted) {
          setChecking(false);
        }
      }
    };

    checkSession();

    return () => {
      isMounted = false;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  if (checking) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#1976D2" />

        <Text style={styles.loadingText}>
          Starting CareKeeperHub…
        </Text>
      </View>
    );
  }

  if (loggedIn) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 16,
    color: '#333333',
    fontSize: 17,
    textAlign: 'center',
  },
});