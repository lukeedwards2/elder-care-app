import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import NavHeader from '../components/NavHeader';

export default function AboutUs() {
  return (
    <View style={styles.container}>
      <NavHeader
        title="About Us"
        helpText="This page provides insight into the mission and purpose of the app."
      />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>About Us</Text>

        <Text style={styles.paragraph}>
          CarekeeperHub & Gizmos for Seniors are both part of our growing group of websites and apps focusing on the senior market.
        </Text>

        <Text style={styles.paragraph}>
          Our family has had 4 parents go through the stages of senior living and hospice. Many times we would think "there has to be an easier way" to care for our parents.
        </Text>

        <Text style={styles.paragraph}>
          Well we think we created an extremely helpful tool with CarekeeperHub and hopefully it will help both you and the ones you are caring for.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#222',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
});

