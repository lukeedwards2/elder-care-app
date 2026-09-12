// app/aboutUs.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import NavHeader from '@/components/NavHeader';

export default function AboutUs() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <NavHeader />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headingContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/(tabs)/profile')}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color="#1976D2"
            />

            <Text style={styles.backText}>
              Account
            </Text>
          </TouchableOpacity>

          <Text style={styles.heading}>
            About Us
          </Text>

          <Text style={styles.subheading}>
            Why CareKeeperHub was created and who we hope it helps.
          </Text>
        </View>

        <View style={styles.introCard}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="heart-outline"
              size={30}
              color="#1976D2"
            />
          </View>

          <Text style={styles.introTitle}>
            Built with caregivers in mind
          </Text>

          <Text style={styles.introText}>
            CareKeeperHub and Gizmos for Seniors are part of our growing
            group of websites and apps focused on helping seniors and the
            people who care for them.
          </Text>
        </View>

        <View style={styles.storyCard}>
          <View style={styles.cardHeader}>
            <View style={styles.smallIconCircle}>
              <Ionicons
                name="people-outline"
                size={22}
                color="#1976D2"
              />
            </View>

            <Text style={styles.cardTitle}>
              Our Experience
            </Text>
          </View>

          <Text style={styles.cardText}>
            Our family has had four parents go through the stages of senior
            living and hospice. Many times, we found ourselves thinking,
            “There has to be an easier way” to help care for our parents.
          </Text>
        </View>

        <View style={styles.storyCard}>
          <View style={styles.cardHeader}>
            <View style={styles.smallIconCircle}>
              <Ionicons
                name="bulb-outline"
                size={22}
                color="#1976D2"
              />
            </View>

            <Text style={styles.cardTitle}>
              The Idea
            </Text>
          </View>

          <Text style={styles.cardText}>
            CareKeeperHub was created to make caregiving information easier
            to organize, easier to share, and easier to keep in one place.
          </Text>
        </View>

        <View style={styles.storyCard}>
          <View style={styles.cardHeader}>
            <View style={styles.smallIconCircle}>
              <Ionicons
                name="hand-left-outline"
                size={22}
                color="#1976D2"
              />
            </View>

            <Text style={styles.cardTitle}>
              Our Goal
            </Text>
          </View>

          <Text style={styles.cardText}>
            We hope CareKeeperHub becomes a helpful tool for both you and the
            people you are caring for, and makes the day-to-day work of
            caregiving a little easier.
          </Text>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            Thank you for using CareKeeperHub.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 36,
  },

  headingContainer: {
    paddingTop: 18,
    paddingBottom: 16,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },

  backText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1976D2',
    marginLeft: 2,
  },

  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: '#20252B',
    marginBottom: 5,
  },

  subheading: {
    fontSize: 15,
    lineHeight: 21,
    color: '#66727D',
  },

  introCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },

  introTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#242A30',
    textAlign: 'center',
    marginBottom: 8,
  },

  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#66727D',
    textAlign: 'center',
  },

  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  smallIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDF5FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#242A30',
  },

  cardText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#5F6B75',
  },

  footerNote: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 10,
  },

  footerText: {
    fontSize: 13,
    color: '#89939C',
  },
});

