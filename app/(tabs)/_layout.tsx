import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import {
  Platform,
  Image,
  Linking,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

export default function TabLayout() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isTablet = width >= 768;

  const tabBarHeight = isTablet ? 88 : 95;
  const iconSize = isTablet ? 31 : 26;
  const gizmosIconSize = isTablet ? 36 : 32;
  const labelSize = isTablet ? 13 : 10.5;

  const handleGizmosPress = async () => {
    try {
      await Linking.openURL('https://gizmosforseniors.com');
    } catch (error) {
      console.warn('Failed to open Gizmos site:', error);
    }

    router.replace('/(tabs)/home');
  };

  const renderTintedIcon = (
    source: any,
    focused: boolean,
    size = iconSize
  ) => (
    <Animated.View
      style={[
        styles.iconContainer,
        {
          transform: [{ scale: focused ? 1.15 : 1 }],
        },
      ]}
    >
      <Image
        source={source}
        style={[
          styles.icon,
          {
            width: size,
            height: size,
            tintColor: focused
              ? '#FFFFFF'
              : 'rgba(255,255,255,0.62)',
          },
        ]}
        resizeMode="contain"
      />
    </Animated.View>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          height: tabBarHeight,
          backgroundColor: '#1976D2',
          borderTopWidth: 0,
          paddingTop: isTablet
            ? 9
            : Platform.OS === 'ios'
              ? 8
              : 4,
          paddingBottom: isTablet
            ? 10
            : Platform.OS === 'ios'
              ? 10
              : 6,
        },

        tabBarItemStyle: {
          paddingVertical: isTablet ? 3 : 0,
        },

        tabBarLabelStyle: {
          fontSize: labelSize,
          fontWeight: '600',
          letterSpacing: isTablet ? 0.2 : 0.3,
          marginTop: isTablet ? 5 : 4,
        },

        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.62)',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) =>
            renderTintedIcon(
              require('../../assets/home.png'),
              focused
            ),
        }}
      />

      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) =>
            renderTintedIcon(
              require('../../assets/schedule.png'),
              focused
            ),
        }}
      />

      <Tabs.Screen
  name="gizmos"
  options={{
    title: 'Gizmos',

    tabBarIcon: ({ focused }) => (
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: focused ? 1.15 : 1 }],
          },
        ]}
      >
        <Image
          source={require('../../assets/gizmos.png')}
          style={{
            width: gizmosIconSize,
            height: gizmosIconSize,
          }}
          resizeMode="contain"
        />
      </Animated.View>
    ),
  }}
  listeners={{
    tabPress: (event) => {
      event.preventDefault();
      void handleGizmosPress();
    },
  }}
/>

      <Tabs.Screen
        name="news"
        options={{
          title: 'Sr News',
          tabBarIcon: ({ focused }) =>
            renderTintedIcon(
              require('../../assets/news10.png'),
              focused
            ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) =>
            renderTintedIcon(
              require('../../assets/user.png'),
              focused
            ),
        }}
      />

      {/* Hidden tab routes */}
      <Tabs.Screen name="newsDetail" options={{ href: null }} />
      <Tabs.Screen name="profileInfo" options={{ href: null }} />
      <Tabs.Screen name="team-members" options={{ href: null }} />
      <Tabs.Screen name="aboutUs" options={{ href: null }} />
      <Tabs.Screen name="contactUs" options={{ href: null }} />

      <Tabs.Screen name="notes" options={{ href: null }} />
      <Tabs.Screen name="addNote" options={{ href: null }} />
      <Tabs.Screen name="noteDetail" options={{ href: null }} />

      <Tabs.Screen name="subscription" options={{ href: null }} />
      <Tabs.Screen name="photos" options={{ href: null }} />
      <Tabs.Screen name="contacts" options={{ href: null }} />
      <Tabs.Screen name="contactForm" options={{ href: null }} />
      <Tabs.Screen name="contactDetail" options={{ href: null }} />
      <Tabs.Screen name="supplies" options={{ href: null }} />
      <Tabs.Screen name="supplyDetail" options={{ href: null }} />
      <Tabs.Screen name="food" options={{ href: null }} />
      <Tabs.Screen name="foodDetail" options={{ href: null }} />
      <Tabs.Screen name="action" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="documentDetail" options={{ href: null }} />
      <Tabs.Screen name="rx" options={{ href: null }} />
      <Tabs.Screen name="rxDetail" options={{ href: null }} />
      <Tabs.Screen name="ambulance" options={{ href: null }} />
      <Tabs.Screen name="ambulanceForm" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    marginBottom: 2,
  },
});



