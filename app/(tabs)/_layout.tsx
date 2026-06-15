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



