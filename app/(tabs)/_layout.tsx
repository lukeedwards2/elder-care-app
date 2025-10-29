import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, Image, View, Text, TouchableOpacity, Linking } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  // function to open website and return to Home
  const handleGizmosPress = async () => {
    try {
      await Linking.openURL('https://gizmosforseniors.com');
    } catch (error) {
      console.warn('Failed to open Gizmos site:', error);
    }
    // ✅ instantly go back to Home tab
    router.push('/home');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 90,
          backgroundColor: '#1976D2',
          paddingBottom: Platform.OS === 'ios' ? 6 : 4,
          paddingTop: Platform.OS === 'ios' ? 6 : 4,
        },
        tabBarLabelStyle: {
          fontSize: 9, // ✅ slightly smaller so text stays on one line
          fontWeight: '600',
          color: 'white',
        },
        tabBarActiveTintColor: 'white',
        tabBarInactiveTintColor: 'white',
      }}
    >
      {/* 🏠 HOME */}
      <Tabs.Screen
        name="home"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.iconContainer}>
              <Image source={require('../../assets/home.png')} style={styles.icon} />
              <Text style={styles.label}>Home</Text>
            </View>
          ),
        }}
      />

      {/* 🗓️ SCHEDULE */}
      <Tabs.Screen
        name="schedule"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.iconContainer}>
              <Image source={require('../../assets/schedule.png')} style={styles.icon} />
              <Text style={styles.label}>Schedule</Text>
            </View>
          ),
        }}
      />

      {/* 🧭 GIZMOS (Color Image + Opens Link + Returns Home) */}
      <Tabs.Screen
        name="gizmos"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.iconContainer}>
              <Image
                source={require('../../assets/gizmos.png')}
                style={[styles.icon, { width: 30, height: 30, tintColor: undefined }]} // ✅ keeps full color
                resizeMode="contain"
              />
              <Text style={styles.label}>Gizmos</Text>
            </View>
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
          title: '',
          tabBarIcon: () => (
            <View style={styles.iconContainer}>
              <Image source={require('../../assets/news10.png')} style={styles.icon} />
              <Text style={styles.label}>Sr News</Text>
            </View>
          ),
        }}
      />

      {/* 👤 ACCOUNT */}
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.iconContainer}>
              <Image source={require('../../assets/user.png')} style={styles.icon} />
              <Text style={styles.label}>Account</Text>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = {
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 0,
    tintColor: 'white',
  },
  label: {
    color: 'white',
    fontSize: 6, // ✅ smaller font fits one line
    fontWeight: '600',
  },
};



